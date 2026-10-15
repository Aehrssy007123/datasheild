import { describe, it, expect } from 'vitest';
import { LocalStorageService } from '../server/src/services/local-storage.service';
import {
  deriveKeyFromPassword,
  encryptBlock,
  decryptBlock,
  computeSha256,
  generateRandomBytes,
  bufferToBase64,
} from '../client/src/services/crypto.service';
import path from 'path';
import os from 'os';

describe('End-to-End Pipeline & Storage Adapter Integration', () => {
  const tempStorageDir = path.join(os.tmpdir(), 'securevault-test-storage-' + Date.now());
  const storage = new LocalStorageService(tempStorageDir);

  it('should initialize and pass health check', async () => {
    const health = await storage.checkHealth();
    expect(health.status).toBe(true);
    expect(health.message).toContain('Local Object Storage');
  });

  it('should execute full lifecycle: Original File -> Segmentation -> AES-GCM Encryption -> Storage Adapter -> Retrieval -> Decryption -> Reconstruction -> SHA-256 Verification', async () => {
    // 1. Prepare simulated file data (3500 bytes of arbitrary binary data)
    const originalFileBytes = generateRandomBytes(3500);
    const originalSha256 = await computeSha256(originalFileBytes);

    const fileId = 'sec_integration_test_1';
    const userId = 'user_student_1';
    const blockSize = 1024;
    const totalBlocks = Math.ceil(originalFileBytes.length / blockSize); // 4 blocks
    expect(totalBlocks).toBe(4);

    const password = 'IntegrationSecurePassword2026!';
    const salt = generateRandomBytes(32);
    const key = await deriveKeyFromPassword(password, salt, 2000);

    // 2. Slicing & Encryption & Storage
    const manifestBlocks = [];
    for (let i = 0; i < totalBlocks; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, originalFileBytes.length);
      const chunk = originalFileBytes.slice(start, end);

      const encrypted = await encryptBlock(chunk.buffer, key, fileId, i, totalBlocks);

      // Store in storage adapter under standard S3 key layout
      const storageKey = `secure-files/${userId}/${fileId}/blocks/${i.toString().padStart(6, '0')}.enc`;
      await storage.putBlock(storageKey, Buffer.from(encrypted.combinedPayload));

      manifestBlocks.push({
        index: i,
        originalSize: chunk.length,
        ciphertextSize: encrypted.ciphertextWithTag.byteLength,
        nonce: bufferToBase64(encrypted.nonce),
        tag: bufferToBase64(encrypted.tag),
        storageKey,
      });
    }

    // 3. Store Manifest
    const manifestStorageKey = `secure-files/${userId}/${fileId}/manifest.json`;
    const manifest = {
      version: '1.0.0',
      fileId,
      userId,
      fileName: 'project_submission_data.bin',
      originalSize: originalFileBytes.length,
      originalSha256,
      blockSize,
      totalBlocks,
      blocks: manifestBlocks,
    };
    await storage.putManifest(manifestStorageKey, manifest);

    // 4. Retrieve Manifest
    const retrievedManifest = await storage.getManifest(manifestStorageKey);
    expect(retrievedManifest.fileId).toBe(fileId);
    expect(retrievedManifest.totalBlocks).toBe(4);
    expect(retrievedManifest.originalSha256).toBe(originalSha256);

    // 5. Retrieve all blocks from storage and Decrypt
    const reconstructedChunks: Uint8Array[] = [];
    for (let i = 0; i < totalBlocks; i++) {
      const blockKey = `secure-files/${userId}/${fileId}/blocks/${i.toString().padStart(6, '0')}.enc`;
      const retrievedBlockBuffer = await storage.getBlock(blockKey);

      // Decrypt using derived key
      const decryptedBuffer = await decryptBlock(retrievedBlockBuffer, key, fileId, i, totalBlocks);
      reconstructedChunks.push(new Uint8Array(decryptedBuffer));
    }

    // 6. Reconstruct complete file
    const totalLength = reconstructedChunks.reduce((acc, c) => acc + c.length, 0);
    const reconstructedFile = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of reconstructedChunks) {
      reconstructedFile.set(chunk, offset);
      offset += chunk.length;
    }

    // 7. SHA-256 Verification Check
    const reconstructedSha256 = await computeSha256(reconstructedFile);
    expect(reconstructedSha256).toBe(originalSha256);
    expect(reconstructedFile.length).toBe(originalFileBytes.length);

    // 8. Delete and verify cleanup
    await storage.deleteFile(fileId, userId, totalBlocks);
    await expect(storage.getBlock(manifestBlocks[0].storageKey)).rejects.toThrow();
  });
});
