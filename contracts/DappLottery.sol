// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "./Lottery.sol";

contract DappLottery {
	address public lottery_manager;
	address public lottery_address;
	bool public lottery_active;


	constructor () {
		lottery_manager = msg.sender;
		lottery_address = address(0);
		lottery_active = false;
	}

	function createLottery(uint M) public {
		require(msg.sender != address(0));
		lottery_manager = msg.sender;
		lottery_address = address(new Lottery(M, msg.sender));
		lottery_active = true;
	}

	function closeLottery() public {
		lottery_manager = address(0);
		lottery_address = address(0);
		lottery_active = false;
	}
}
