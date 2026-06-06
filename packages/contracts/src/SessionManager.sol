// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SessionTypes.sol";
import "./SessionErrors.sol";
import "./SessionEvents.sol";
import "./SessionEIP712.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDemoGame {
    function executeAction(address player, uint16 actionId, bytes calldata params) external;
}

/// @title SessionManager
/// @notice Gestor de sesiones para Monad Session Arena
contract SessionManager is SessionEIP712, SessionEvents {
    using SessionTypes for *;

    mapping(bytes32 => SessionTypes.SessionPolicy) public sessionPolicies;
    mapping(bytes32 => SessionTypes.SessionState) public sessionStates;

    function createSession(
        SessionTypes.SessionPolicy calldata policy,
        bytes calldata signature
    ) external returns (bytes32) {
        if (policy.owner == address(0)) revert SessionErrors.InvalidOwner();
        if (policy.sessionKey == address(0)) revert SessionErrors.InvalidSessionKey();
        if (policy.validUntil <= block.timestamp) revert SessionErrors.SessionExpired();
        if (policy.maxCalls == 0) revert SessionErrors.MaxCallsExceeded();

        bytes32 digest = _hashSessionGrant(policy);
        address signer = _recoverSigner(digest, signature);
        if (signer != policy.owner) revert SessionErrors.InvalidSignature();

        // Derivar sessionId determinístico
        bytes32 sessionId = keccak256(
            abi.encode(
                policy.owner,
                policy.sessionKey,
                policy.validUntil,
                policy.maxCalls,
                policy.gameContract,
                policy.allowedActions,
                policy.token,
                policy.maxTokenSpend,
                policy.salt,
                block.chainid,
                address(this)
            )
        );

        if (sessionPolicies[sessionId].owner != address(0)) {
            revert SessionErrors.SessionAlreadyExists();
        }

        sessionPolicies[sessionId] = policy;
        // El estado por defecto (ceros) ya es correcto
        
        emit SessionCreated(sessionId, policy.owner, policy.sessionKey, policy.validUntil);
        return sessionId;
    }

    function revokeSession(bytes32 sessionId) external {
        SessionTypes.SessionPolicy memory policy = sessionPolicies[sessionId];
        if (policy.owner == address(0)) revert SessionErrors.SessionNotFound();
        
        // Solo el owner puede revocar
        if (msg.sender != policy.owner) {
            // Permitimos revocación firmada? El spec de hackathon dice "revocación via relayer"
            // Por ahora, solo si msg.sender es owner. Se puede extender si se requiere firma para revocar.
            revert SessionErrors.InvalidOwner();
        }

        sessionStates[sessionId].revoked = true;
        emit SessionRevoked(sessionId);
    }

    function executeAction(
        SessionTypes.SessionAction calldata action,
        bytes calldata params,
        bytes calldata signature
    ) external {
        if (action.deadline < block.timestamp) revert SessionErrors.ActionExpired();

        SessionTypes.SessionPolicy memory policy = sessionPolicies[action.sessionId];
        if (policy.owner == address(0)) revert SessionErrors.SessionNotFound();

        SessionTypes.SessionState storage state = sessionStates[action.sessionId];
        
        if (state.revoked) revert SessionErrors.SessionRevoked();
        if (block.timestamp > policy.validUntil) revert SessionErrors.SessionExpired();
        if (state.nonce != action.nonce) revert SessionErrors.InvalidNonce();
        if (state.callCount >= policy.maxCalls) revert SessionErrors.MaxCallsExceeded();
        
        // Verificar acción permitida (bitmask: e.g. MOVE=bit1→2, ATTACK=bit2→4, COLLECT=bit3→8, BUY_ITEM=bit4→16)
        if ((policy.allowedActions & (uint16(1) << action.actionId)) == 0) {
            revert SessionErrors.ActionNotAllowed();
        }

        bytes32 paramsHash = keccak256(params);
        if (paramsHash != action.paramsHash) revert SessionErrors.InvalidSignature();

        bytes32 digest = _hashSessionAction(action);
        address signer = _recoverSigner(digest, signature);
        if (signer != policy.sessionKey) revert SessionErrors.InvalidSignature();

        // Actualizar estado ANTES de llamada externa
        state.nonce += 1;
        state.callCount += 1;

        // Validar y procesar spend limit si actionId == 4 (BUY_ITEM)
        if (action.actionId == 4) {
            uint256 itemCost = 10 * 1e18; // Costo mockeado de acuerdo a la spec
            if (state.tokenSpent + itemCost > policy.maxTokenSpend) {
                revert SessionErrors.SpendLimitExceeded();
            }
            state.tokenSpent += itemCost;
            
            // Transferir tokens (el usuario debe haber dado allowance al SessionManager)
            if (policy.token != address(0)) {
                IERC20(policy.token).transferFrom(policy.owner, address(this), itemCost);
                // Si el itemCost va al relayer o se quema, se maneja aquí. Por ahora al SessionManager.
            }
        }

        // Llamar al game contract
        IDemoGame(policy.gameContract).executeAction(policy.owner, action.actionId, params);

        emit SessionActionExecuted(action.sessionId, action.actionId, action.nonce);
    }
}
