// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SessionEvents
/// @notice Eventos emitidos por SessionManager
interface SessionEvents {
    event SessionCreated(
        bytes32 indexed sessionId,
        address indexed owner,
        address indexed sessionKey,
        uint48 validUntil
    );

    event SessionActionExecuted(
        bytes32 indexed sessionId,
        uint16 actionId,
        uint256 nonce
    );

    event SessionRevoked(
        bytes32 indexed sessionId
    );
}
