import { keccak256, toHex, stringToHex } from 'viem';
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
  console.log(e, keccak256(stringToHex(e)).slice(0, 10));
});
