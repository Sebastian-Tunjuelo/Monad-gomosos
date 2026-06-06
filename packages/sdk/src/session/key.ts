import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

/**
 * Generates a transient session key pair.
 * In a real application, this should be stored securely (e.g. IndexedDB or memory)
 * and should be cleared when the session is revoked or expired.
 */
export function generateSessionKey() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  
  return {
    privateKey,
    account,
    address: account.address
  };
}
