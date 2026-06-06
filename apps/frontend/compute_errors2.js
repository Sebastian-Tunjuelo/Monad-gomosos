import crypto from 'crypto';
const errors = [
  'InvalidOwner()',
  'InvalidSessionKey()',
  'SessionAlreadyExists()',
  'SessionNotFound()',
  'SessionExpired()',
  'SessionRevoked()',
  'InvalidSignature()',
  'InvalidNonce()',
  'MaxCallsExceeded()',
  'ActionNotAllowed()',
  'SpendLimitExceeded()',
  'ActionExpired()'
];

function keccak256(str) {
  // Using SHA3-256 for Keccak256 equivalent in basic crypto is tricky because Node.js crypto's sha3-256 is actually FIPS 202 SHA3, not Keccak-256 used in Ethereum.
}
