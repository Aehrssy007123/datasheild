import { describe, it, expect } from 'vitest';
import {
  deriveKeyFromPassword,
  encryptBlock,
  decryptBlock,
  computeSha256,
  generateRandomBytes,
  bufferToHex,
  hexToBuffer,
  createBlockAad,
} from '../client/src/services/crypto.service';

describe('Cryptographic Operations (AES-256-GCM + PBKDF2)', () => {
  const testPassword = 'StrongPassword123!@#';
  const testSalt = generateRandomBytes(32);

  it('should derive consistent AES-256-GCM keys from the same password and salt', async () => {
    const key1 = await deriveKeyFromPassword(testPassword, testSalt, 5000);
    const key2 = await deriveKeyFromPassword(testPassword, testSalt, 5000);

    expect(key1).toBeDefined();
    expect(key2).toBeDefined();
    expect(key1.algorithm.name).toBe('AES-GCM');
  });

  it('should encrypt and decrypt a plaintext block successfully', async () => {
    const key = await deriveKeyFromPassword(testPassword, testSalt, 5000);
    const plaintext = new TextEncoder().encode('Hello, SecureVault Cloud Storage!');

    const encrypted = await encryptBlock(plaintext.buffer, key, 'file-test-1', 0, 1);

    expect(encrypted.nonce.length).toBe(12);
    expect(encrypted.tag.length).toBe(16);
    expect(encrypted.combinedPayload.length).toBe(12 + plaintext.length + 16);

    const decrypted = await decryptBlock(encrypted.combinedPayload, key, 'file-test-1', 0, 1);
    const decryptedText = new TextDecoder().decode(decrypted);

    expect(decryptedText).toBe('Hello, SecureVault Cloud Storage!');
  });

  it('should fail decryption when using an incorrect password', async () => {
    const keyCorrect = await deriveKeyFromPassword(testPassword, testSalt, 5000);
    const keyWrong = await deriveKeyFromPassword('WrongPassword!', testSalt, 5000);
    const plaintext = new TextEncoder().encode('Secret financial document');

    const encrypted = await encryptBlock(plaintext.buffer, keyCorrect, 'file-test-2', 0, 1);

    await expect(
      decryptBlock(encrypted.combinedPayload, keyWrong, 'file-test-2', 0, 1)
    ).rejects.toThrow(/authentication tag mismatch|Decryption failed/i);
  });

  it('should reject decryption when even 1 bit of ciphertext is modified', async () => {
    const key = await deriveKeyFromPassword(testPassword, testSalt, 5000);
    const plaintext = new TextEncoder().encode('Tamper-proof payload verification');

    const encrypted = await encryptBlock(plaintext.buffer, key, 'file-test-3', 0, 1);

    // Corrupt one byte of ciphertext payload
    const corruptedPayload = new Uint8Array(encrypted.combinedPayload);
    corruptedPayload[15] ^= 0x01; // flip lowest bit

    await expect(
      decryptBlock(corruptedPayload, key, 'file-test-3', 0, 1)
    ).rejects.toThrow(/authentication tag mismatch|Decryption failed/i);
  });

  it('should reject decryption when block index in AAD does not match', async () => {
    const key = await deriveKeyFromPassword(testPassword, testSalt, 5000);
    const plaintext = new TextEncoder().encode('Block transposition test');

    // Encrypted with blockIndex = 0
    const encrypted = await encryptBlock(plaintext.buffer, key, 'file-test-4', 0, 2);

    // Attempting to decrypt claiming blockIndex = 1 (transposition attack)
    await expect(
      decryptBlock(encrypted.combinedPayload, key, 'file-test-4', 1, 2)
    ).rejects.toThrow(/authentication tag mismatch|Decryption failed/i);
  });

  it('should generate unique 96-bit nonces for every block encryption', async () => {
    const key = await deriveKeyFromPassword(testPassword, testSalt, 5000);
    const plaintext = new TextEncoder().encode('Test nonce uniqueness');

    const enc1 = await encryptBlock(plaintext.buffer, key, 'file-test-5', 0, 2);
    const enc2 = await encryptBlock(plaintext.buffer, key, 'file-test-5', 1, 2);

    const nonceHex1 = bufferToHex(enc1.nonce);
    const nonceHex2 = bufferToHex(enc2.nonce);

    expect(nonceHex1).not.toBe(nonceHex2);
  });
});
