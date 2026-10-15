import { describe, it, expect } from 'vitest';
import {
  calculateBlockCount,
} from '../client/src/services/segmentation.service';
import {
  deriveKeyFromPassword,
  encryptBlock,
  decryptBlock,
  generateRandomBytes,
  computeSha256,
} from '../client/src/services/crypto.service';

describe('File Segmentation and Reconstruction Engine', () => {
  it('should calculate correct block count for various sizes', () => {
    expect(calculateBlockCount(0, 524288)).toBe(0);
    expect(calculateBlockCount(100, 524288)).toBe(1);
    expect(calculateBlockCount(524288, 524288)).toBe(1);
    expect(calculateBlockCount(524289, 524288)).toBe(2);
    expect(calculateBlockCount(1048576, 524288)).toBe(2);
    expect(calculateBlockCount(1048577, 524288)).toBe(3);
  });

  it('should segment a binary buffer, encrypt each block, decrypt, and reassemble perfectly', async () => {
    // Generate 5000 random binary bytes
    const originalBinary = generateRandomBytes(5000);
    const originalSha256 = await computeSha256(originalBinary);

    const blockSize = 1024;
    const totalBlocks = calculateBlockCount(originalBinary.length, blockSize);
    expect(totalBlocks).toBe(5);

    const salt = generateRandomBytes(32);
    const key = await deriveKeyFromPassword('SegmentationSecret!', salt, 2000);

    const encryptedBlocks: { index: number; payload: Uint8Array }[] = [];

    // Segmentation & encryption
    for (let i = 0; i < totalBlocks; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, originalBinary.length);
      const slice = originalBinary.slice(start, end);

      const enc = await encryptBlock(slice.buffer, key, 'file-seg-test', i, totalBlocks);
      encryptedBlocks.push({ index: i, payload: enc.combinedPayload });
    }

    // Decryption & reconstruction
    const decryptedChunks: Uint8Array[] = [];
    for (let i = 0; i < totalBlocks; i++) {
      const block = encryptedBlocks[i];
      const decBuffer = await decryptBlock(block.payload, key, 'file-seg-test', i, totalBlocks);
      decryptedChunks.push(new Uint8Array(decBuffer));
    }

    // Combine reconstructed chunks
    const totalLength = decryptedChunks.reduce((acc, c) => acc + c.length, 0);
    const reconstructedBinary = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of decryptedChunks) {
      reconstructedBinary.set(chunk, offset);
      offset += chunk.length;
    }

    expect(reconstructedBinary.length).toBe(originalBinary.length);

    // Verify byte-for-byte equality
    for (let i = 0; i < originalBinary.length; i++) {
      expect(reconstructedBinary[i]).toBe(originalBinary[i]);
    }

    // Verify SHA-256 integrity match
    const reconstructedSha256 = await computeSha256(reconstructedBinary);
    expect(reconstructedSha256).toBe(originalSha256);
  });

  it('should handle empty binary files gracefully', async () => {
    const empty = new Uint8Array(0);
    const emptyHash = await computeSha256(empty);
    expect(emptyHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
