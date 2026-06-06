// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SessionErrors
/// @notice Errores custom para SessionManager
interface SessionErrors {
    error InvalidOwner();
    error InvalidSessionKey();
    error SessionAlreadyExists();
    error SessionNotFound();
    error SessionExpired();
    error SessionRevoked();
    error InvalidSignature();
    error InvalidNonce();
    error MaxCallsExceeded();
    error ActionNotAllowed();
    error SpendLimitExceeded();
    error ActionExpired();
}
