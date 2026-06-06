// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SessionTypes
/// @notice Estructuras de datos para Session Keys
library SessionTypes {
    /// @dev Representa la política de permisos de una sesión.
    struct SessionPolicy {
        address owner;
        address sessionKey;
        uint48 validUntil;
        uint32 maxCalls;
        address gameContract;
        uint16 allowedActions; // Bitmask: MOVE=2 (1<<1), ATTACK=4 (1<<2), COLLECT=8 (1<<3), BUY_ITEM=16 (1<<4)
        address token;
        uint256 maxTokenSpend;
        bytes32 salt;
    }

    /// @dev Estado actual de la sesión.
    struct SessionState {
        uint32 callCount;
        uint256 tokenSpent;
        uint256 nonce;
        bool revoked;
    }

    /// @dev Representa una acción a ejecutar
    struct SessionAction {
        bytes32 sessionId;
        uint256 nonce;
        uint16 actionId;
        bytes32 paramsHash;
        uint48 deadline;
    }
}
