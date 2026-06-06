const { keccak256, toUtf8Bytes } = require('ethers').utils;
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
  console.log(e, keccak256(toUtf8Bytes(e)).slice(0, 10));
});
