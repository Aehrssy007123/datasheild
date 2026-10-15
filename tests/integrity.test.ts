import { describe, it, expect } from 'vitest';
import {
  computeSha256,
  generateRandomBytes,
  deriveKeyFromPassword,
  encryptBlock,
  decryptBlock,
} from '../client/src/services/crypto.service';

describe('SHA-256 Integrity Verification and Tampering Detection', () => {
  it('should compute valid 64-character hexadecimal SHA-256 digests', async () => {
    const data = new TextEncoder().encode('Computer Engineering Mini Project 2026');
    const digest = await computeSha256(data);

    expect(digest.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(digest)).toBe(true);
  });

  it('should detect when data has been altered by even one character', async () => {
    const original = new TextEncoder().encode('Authorized AWS S3 bucket transaction');
    const altered = new TextEncoder().encode('Authorized AWS S3 bucket Transaction'); // Capital 'T'

    const hash1 = await computeSha256(original);
    const hash2 = await computeSha256(altered);

    expect(hash1).not.toBe(hash2);
  });

  it('should verify that a modified reconstructed payload fails SHA-256 verification', async () => {
    const originalData = generateRandomBytes(2048);
    const expectedHash = await computeSha256(originalData);

    // Simulate corrupted reconstruction where byte 100 was altered
    const corruptedData = new Uint8Array(originalData);
    corruptedData[100] ^= 0x55;

    const actualHash = await computeSha256(corruptedData);
    expect(actualHash).not.toBe(expectedHash);
  });
});
