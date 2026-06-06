const { keccak256, toHex } = require('viem');
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
errors.forEach(e => {
  console.log(e, keccak256(toHex(e)).slice(0, 10));
});
