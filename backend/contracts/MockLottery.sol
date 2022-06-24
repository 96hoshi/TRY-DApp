// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Lottery.sol";

// Mock Lottery used to execute deterministic tests
contract MockLottery is Lottery(5) {

    function mockDrawNumbers(uint[6] memory numbers) public {
        require(lotteryActive);
        require(msg.sender == lotteryManager, "Only the manager can draw the numbers of the lottery.");
        require(block.number > numberClosedRound + K, "Error: You need to wait to extract numbers.");

        winningNumbers = numbers;
    }
}
