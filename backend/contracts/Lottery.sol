// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "./NFTManager.sol";


contract Lottery {

    uint private constant TICKET_PRICE = 100 gwei;
    uint private constant N_NUMBERS = 6;
    uint private constant MAX_NUMBER = 69;
    uint private constant MAX_POWERBALL = 26;
    uint public constant K = 5;                             // parameter to draw numbers

    uint public M;
    bool public lotteryActive;
    address [] public players;
    address public lotteryManager;
    uint public numberClosedRound;
    uint [N_NUMBERS] public winningNumbers;
    NFTManager private NFTman;

    mapping(uint => bool) private NFTAviable;                // uint NFT class => aviability in lottery storage
    mapping(uint => uint256) private NFTPrize;               // uint NFT class => NFT tokenId 
    mapping(address => uint[]) public NFTList;               // address of the owner => list of NFT possessed
    mapping(uint => address) private NFTMap;                 // NFT tokenId => owner address

    mapping(address => uint[]) private userTicketList;       // address of the owner => list of ticket possessed
    mapping(uint => uint[N_NUMBERS]) private ticketNumbers;  // index of the ticket => numbers of the corresponing ticket
    uint private tickets;                                    // store tickets id

    event OpenRound(uint roundEnds);    
    event CloseRound(uint[N_NUMBERS] winningNumbers);
    event CloseContract();
    event NFTPrizeWon(address winner, uint NFTtoken, uint nftClass);
    event BuyTicket(address owner, uint[N_NUMBERS] ticket);
    event RedrawNumber(uint index);


    constructor (uint _M) {
        lotteryManager = msg.sender;
        M = _M;
        lotteryActive = true;
        NFTman = new NFTManager();
        tickets = 0;

        // initialize NFTs
        for (uint i = 1 ; i < 9; i++) {
            NFTPrize[i] = mint(i);
            NFTAviable[i] = true;
       }
        // fixed round duration in terms of number of blocks
        numberClosedRound = block.number + M;
        emit OpenRound(numberClosedRound);
    }

    // allows users to buy a ticket. The numbers picked by a user in
    // that ticket are passed as input of the function.
    function buy (uint [N_NUMBERS] memory _numbers) public payable {
        require(lotteryActive);
        require(block.number <= numberClosedRound, "Error: No lottery round active now.");
        require(_numbers.length == N_NUMBERS, "Error: You need to provide 6 numbers to participate the lottery.");
        require(msg.sender != address(0));

        uint money = msg.value;
        address sender = msg.sender;
        uint change;

        require(money >= TICKET_PRICE, "Error: Not enough tokens to buy the ticket.");
        // if player already has a ticket do not push it in player list

        if (!validate(_numbers)) {
            revert("Error: Invalid numbers used.");
        }

        if (userTicketList[sender].length == 0){
            players.push(sender);
        }
        if (money > TICKET_PRICE) {
            change = money - TICKET_PRICE;
            // refund change
            payable(sender).transfer(change);
        }

        // save the ticket
        ticketNumbers[tickets] = _numbers;
        userTicketList[sender].push(tickets);
        tickets++;

        emit BuyTicket(sender, _numbers);
    }

    // checks if the previous round is finished, and, if that's the case, starts a new round.
    function startNewRound () public {
        require(lotteryActive);
        require(msg.sender == lotteryManager, "Only the manager can start the lottery.");
        require(block.number > numberClosedRound + K, "A lottery round is still active. You can not start a new round now.");

        numberClosedRound = block.number + M;
        emit OpenRound(numberClosedRound);
    }

    // used by the lottery operator to draw numbers of the current lottery round
    function drawNumbers () public {
        require(lotteryActive);
        require(msg.sender == lotteryManager, "Only the manager can draw the numbers of the lottery.");
        require(block.number > numberClosedRound + K, "Error: You need to wait to extract numbers.");
        require(winningNumbers[0] == 0 || winningNumbers.length == 0);

        uint drawn;
        uint [N_NUMBERS] memory drawnNumbers;
        uint nonce = block.difficulty;

        for (uint i = 0; i < N_NUMBERS; i++) {
            if (i != N_NUMBERS - 1) {
                drawn = drawRandom(nonce++, block.timestamp, MAX_NUMBER);
            } else {
                drawn = drawRandom(nonce++, block.timestamp, MAX_POWERBALL);
            }
            if ((isInArray(0, i, drawn, drawnNumbers))) {
                // redraw the number to avoid duplicates
                emit RedrawNumber(i);
                i--;
            } else {
                drawnNumbers[i] = drawn;
            }
        }
        winningNumbers = drawnNumbers;

        emit CloseRound(drawnNumbers);
    }

    // used by lottery operator to distribute the prizes of the current lottery round
    function givePrizes () public {
        require(lotteryActive);
        require(msg.sender == lotteryManager, "Only the manager can give prizes lottery.");
        require(block.number > numberClosedRound + K, "Error: the round is still active.");

        uint [] memory ticket_index;
        uint [N_NUMBERS] memory t_numbers;
        uint prize_class;
        uint prize;
        address player;

        for (uint i = 0; i < players.length; i++) {
            // retrieve the index list of a player's tickets
            player = players[i];
            ticket_index = userTicketList[player];
            for (uint j = 0; j < ticket_index.length; j++) {
                // for every ticket retrive the numbers
                t_numbers = ticketNumbers[ticket_index[j]];
                // check if it is a winning ticket
                prize_class = checkWinner(t_numbers);

                if (prize_class > 0) {
                    if (!NFTAviable[prize_class]) {
                        NFTPrize[prize_class] = mint(prize_class);
                    }
                    prize = NFTPrize[prize_class];
                    // transfer the ownership of the prize of that class
                    NFTman.transferOwn(player, prize);
                    NFTAviable[prize_class] = false;
                    // update user belongings
                    NFTList[player].push(prize);
                    NFTMap[prize] = player;

                    emit NFTPrizeWon(player, prize, prize_class);
                }
                delete ticketNumbers[ticket_index[j]];
            }
            delete userTicketList[player];
        }
        payable(lotteryManager).transfer(address(this).balance);

        tickets = 0;
        delete players;
        delete winningNumbers;
    }

    // used to mint new collectibles
    function mint (uint _class) private returns (uint256) {
        require(msg.sender == lotteryManager, "Only the manager can mint prizes.");
        require(_class > 0 && _class < 9);

        uint id = NFTman.awardItem(_class);
        return id;
    } 

    // deactivates the lottery contract
    function closeLottery (address _to) public {
        require(lotteryActive);
        require(msg.sender == lotteryManager, "Only the manager can close the lottery contract.");

        uint n_ticket;
        
        // if the round is still active
        if (block.number < numberClosedRound) {
           for (uint i = 0; i < players.length; i++) {
            // send back the total amount corresponding to the prices of all the tickets bought in that round.
                n_ticket = userTicketList[players[i]].length;
                if (n_ticket > 0){
                    payable(players[i]).transfer(TICKET_PRICE * n_ticket);
                }
            }
        } else {
            // if the round is finished but prizes were not been sent yet
            if (winningNumbers.length > 0) {
                givePrizes();
            }
        }
        // close contract
        lotteryActive = false;
        emit CloseContract();
        selfdestruct(payable(_to));
    }

    /* *************  Support functions  ************* */

    // checks if a ticket do not contains duplicates and if the numbers are valid
    function validate(uint [N_NUMBERS] memory array) private pure returns (bool) {
        uint val;

        for (uint i = 0; i < N_NUMBERS; i++) {
            val = array[i];
            // check for valid numbers 
            if (i == N_NUMBERS - 1) {
                if (val < 0 || val > MAX_POWERBALL) {
                    return false;
                }
            } else {
                if (val < 0 || val > MAX_NUMBER) {
                    return false;
                }
            }
            // check for duplicates
            if (isInArray(i+1, N_NUMBERS - 1, val, array)) {
                return false;
            }
        }
        return true;
    }

    // checks if a value is contained in the input array
    function isInArray(uint start, uint end, uint value, uint [N_NUMBERS] memory array) private pure returns (bool) {
        for (uint i = start; i < end; i++) {
            if (value == array[i]) {
                return true;
            }
        }
        return false;
    }

    // generates a random number
    function drawRandom(uint a, uint b, uint mod) private pure returns (uint) {
        return uint(keccak256(abi.encodePacked(a, b))) % mod + 1;
    }

    // iterates over the numbers of a ticket and checks if they match the winning numbers
    // if there is a match returns the class of prize expected
    function checkWinner(uint [N_NUMBERS] memory _numbers) private view returns (uint) {
        uint count = 0;
        bool powerball = false;
        uint [N_NUMBERS] memory wNumbers = winningNumbers;

        for (uint i; i < N_NUMBERS; i++) {
            if (i == N_NUMBERS - 1) {
                if (_numbers[i] == wNumbers[i]) {
                    powerball = true;
                }
            } else {
                if (isInArray(0, N_NUMBERS - 1, _numbers[i], wNumbers)) {
                    count++;
                }
            }
        }
        if (count == 0 && powerball) {
            return 8;
        }
        if (count == 1 && !powerball) {
            return 7;
        }
        if (count == 1 && powerball || count == 2 && !powerball) {
            return 6;
        }
        if (count == 2 && powerball || count == 3 && !powerball) {
            return 5;
        }
        if (count == 3 && powerball || count == 4 && !powerball) {
            return 4;
        }
        if (count == 4 && powerball) {
            return 3;
        }
        if (count == 5 && !powerball) {
            return 2;
        }
        if (count == 5 && powerball) {
            return 1;
        } else {
            return 0;
        }

    }
}
