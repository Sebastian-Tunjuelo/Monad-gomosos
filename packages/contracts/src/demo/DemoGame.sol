// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../SessionManager.sol";

contract DemoGame is IDemoGame {
    mapping(address => uint256) public playerMoves;
    mapping(address => uint256) public playerAttacks;
    mapping(address => uint256) public playerCollects;
    mapping(address => uint256) public playerItems;

    function executeAction(address player, uint16 actionId, bytes calldata params) external {
        if (actionId == 1) {
            // MOVE
            playerMoves[player] += 1;
        } else if (actionId == 2) {
            // ATTACK
            playerAttacks[player] += 1;
        } else if (actionId == 3) {
            // COLLECT
            playerCollects[player] += 1;
        } else if (actionId == 4) {
            // BUY_ITEM
            playerItems[player] += 1;
        }
    }
}
