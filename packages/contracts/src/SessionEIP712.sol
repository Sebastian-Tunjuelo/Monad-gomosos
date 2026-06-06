// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./SessionTypes.sol";
import "./SessionErrors.sol";

/// @title SessionEIP712
/// @notice Lógica EIP-712 para las firmas de Session Manager
contract SessionEIP712 is EIP712 {
    using ECDSA for bytes32;

    bytes32 private constant SESSION_GRANT_TYPEHASH = keccak256(
        "SessionGrant(address owner,address sessionKey,uint48 validUntil,uint32 maxCalls,address gameContract,uint16 allowedActions,address token,uint256 maxTokenSpend,bytes32 salt)"
    );

    bytes32 private constant SESSION_ACTION_TYPEHASH = keccak256(
        "SessionAction(bytes32 sessionId,uint256 nonce,uint16 actionId,bytes32 paramsHash,uint48 deadline)"
    );

    constructor() EIP712("MonadSessionArena", "1") {}

    function _hashSessionGrant(SessionTypes.SessionPolicy memory policy) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    SESSION_GRANT_TYPEHASH,
                    policy.owner,
                    policy.sessionKey,
                    policy.validUntil,
                    policy.maxCalls,
                    policy.gameContract,
                    policy.allowedActions,
                    policy.token,
                    policy.maxTokenSpend,
                    policy.salt
                )
            )
        );
    }

    function _hashSessionAction(SessionTypes.SessionAction memory action) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    SESSION_ACTION_TYPEHASH,
                    action.sessionId,
                    action.nonce,
                    action.actionId,
                    action.paramsHash,
                    action.deadline
                )
            )
        );
    }

    function _recoverSigner(bytes32 digest, bytes memory signature) internal pure returns (address) {
        (address signer, ECDSA.RecoverError err, ) = digest.tryRecover(signature);
        if (err != ECDSA.RecoverError.NoError) {
            revert SessionErrors.InvalidSignature();
        }
        return signer;
    }
}
