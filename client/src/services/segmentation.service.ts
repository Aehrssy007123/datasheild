/**
 * SecureVault Cloud - File Segmentation and Reconstruction Service
 * Implements bounded-memory Blob slicing, ordered block handling,
 * reconstructor with SHA-256 verification, and integrity checking.
 */

import { BlockMetadata, FileManifest } from '../types';
import {
  computeBlobSha256,
  computeSha256,
  generateRandomBytes,
  deriveKeyFromPassword,
  encryptBlock,
  decryptBlock,
  bufferToBase64,
  base64ToBuffer,
  SALT_LENGTH_BYTES,
  PBKDF2_ITERATIONS,
} from './crypto.service';

export interface SegmentationProgressCallback {
  (currentBlock: number, totalBlocks: number, bytesProcessed: number, totalBytes: number, stageName: string): void;
}

export interface SegmentationResult {
  manifest: FileManifest;
  encryptedBlocks: {
    index: number;
    combinedPayload: Uint8Array;
    metadata: BlockMetadata;
  }[];
}

/**
 * Calculates number of blocks for a given file size and block size
 */
export function calculateBlockCount(fileSize: number, blockSize: number): number {
  if (fileSize <= 0) return 0;
  return Math.ceil(fileSize / blockSize);
}

/**
 * Segments and encrypts a file using Web Crypto API and Blob.slice
 */
export async function segmentAndEncryptFile(
  file: File,
  password: string,
  blockSize: number,
  userId: string = 'user-default',
  onProgress?: SegmentationProgressCallback,
  abortSignal?: AbortSignal
): Promise<SegmentationResult> {
  const fileId = 'sec_' + window.crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const totalBytes = file.size;
  const totalBlocks = calculateBlockCount(totalBytes, blockSize);

  if (abortSignal?.aborted) {
    throw new Error('Operation cancelled by user');
  }

  // 1. Compute original file SHA-256 for end-to-end verification
  if (onProgress) onProgress(0, totalBlocks, 0, totalBytes, 'Computing original SHA-256 digest');
  const originalSha256 = await computeBlobSha256(file);

  if (abortSignal?.aborted) {
    throw new Error('Operation cancelled by user');
  }

  // 2. Generate random 32-byte salt per file
  const salt = generateRandomBytes(SALT_LENGTH_BYTES);
  const saltBase64 = bufferToBase64(salt);

  // 3. Derive AES-256-GCM key using PBKDF2 (100,000 iterations)
  if (onProgress) onProgress(0, totalBlocks, 0, totalBytes, 'Deriving AES-256-GCM key via PBKDF2');
  const cryptoKey = await deriveKeyFromPassword(password, salt, PBKDF2_ITERATIONS);

  const encryptedBlocks: {
    index: number;
    combinedPayload: Uint8Array;
    metadata: BlockMetadata;
  }[] = [];

  const blocksMetadata: BlockMetadata[] = [];

  // Special case: 0-byte empty file
  if (totalBlocks === 0) {
    const emptyManifest: FileManifest = {
      version: '1.0.0',
      fileId,
      userId,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      originalSize: 0,
      originalSha256,
      blockSize,
      totalBlocks: 0,
      createdAt: new Date().toISOString(),
      encryption: {
        algorithm: 'AES-256-GCM',
        tagLength: 128,
        kdf: {
          name: 'PBKDF2',
          hash: 'SHA-256',
          iterations: PBKDF2_ITERATIONS,
          salt: saltBase64,
        },
      },
      blocks: [],
      manifestHash: await computeSha256(new TextEncoder().encode(fileId + '|0|' + originalSha256)),
    };

    return {
      manifest: emptyManifest,
      encryptedBlocks: [],
    };
  }

  let bytesProcessed = 0;

  // 4. Process each block iteratively with Blob.slice (memory-efficient)
  for (let blockIndex = 0; blockIndex < totalBlocks; blockIndex++) {
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled by user');
    }

    const startByte = blockIndex * blockSize;
    const endByte = Math.min(startByte + blockSize, totalBytes);
    const chunkBlob = file.slice(startByte, endByte);
    const chunkBuffer = await chunkBlob.arrayBuffer();

    if (onProgress) {
      onProgress(
        blockIndex + 1,
        totalBlocks,
        bytesProcessed,
        totalBytes,
        `Encrypting block ${blockIndex + 1} of ${totalBlocks} (AES-256-GCM)`
      );
    }

    const encrypted = await encryptBlock(chunkBuffer, cryptoKey, fileId, blockIndex, totalBlocks);

    const blockMeta: BlockMetadata = {
      index: blockIndex,
      originalSize: chunkBuffer.byteLength,
      ciphertextSize: encrypted.ciphertextWithTag.byteLength,
      nonce: bufferToBase64(encrypted.nonce),
      tag: bufferToBase64(encrypted.tag),
      sha256Plaintext: encrypted.sha256Plaintext,
      storageKey: `secure-files/${userId}/${fileId}/blocks/${blockIndex.toString().padStart(6, '0')}.enc`,
    };

    blocksMetadata.push(blockMeta);

    encryptedBlocks.push({
      index: blockIndex,
      combinedPayload: encrypted.combinedPayload,
      metadata: blockMeta,
    });

    bytesProcessed += chunkBuffer.byteLength;
  }

  // 5. Generate authenticated manifest
  const manifestDataToHash = `${fileId}|${file.name}|${totalBytes}|${originalSha256}|${blockSize}|${totalBlocks}|${saltBase64}`;
  const manifestHash = await computeSha256(new TextEncoder().encode(manifestDataToHash));

  const manifest: FileManifest = {
    version: '1.0.0',
    fileId,
    userId,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    originalSize: totalBytes,
    originalSha256,
    blockSize,
    totalBlocks,
    createdAt: new Date().toISOString(),
    encryption: {
      algorithm: 'AES-256-GCM',
      tagLength: 128,
      kdf: {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations: PBKDF2_ITERATIONS,
        salt: saltBase64,
      },
    },
    blocks: blocksMetadata,
    manifestHash,
  };

  return {
    manifest,
    encryptedBlocks,
  };
}

export interface ReconstructionResult {
  reconstructedBlob: Blob;
  reconstructedSha256: string;
  expectedSha256: string;
  isIntegrityVerified: boolean;
  fileSize: number;
}

/**
 * Decrypts downloaded encrypted blocks and reconstructs the original file
 * Strictly verifies AES-GCM tags and the overall SHA-256 digest
 */
export async function decryptAndReconstructFile(
  manifest: FileManifest,
  encryptedBlockPayloads: Map<number, ArrayBuffer | Uint8Array>,
  password: string,
  onProgress?: (currentBlock: number, totalBlocks: number, stageName: string) => void,
  abortSignal?: AbortSignal
): Promise<ReconstructionResult> {
  if (abortSignal?.aborted) {
    throw new Error('Download / decryption cancelled');
  }

  // 1. Handle empty file case
  if (manifest.totalBlocks === 0 || manifest.originalSize === 0) {
    const emptyBlob = new Blob([], { type: manifest.fileType || 'application/octet-stream' });
    const emptyHash = await computeSha256(new Uint8Array(0));
    return {
      reconstructedBlob: emptyBlob,
      reconstructedSha256: emptyHash,
      expectedSha256: manifest.originalSha256,
      isIntegrityVerified: emptyHash === manifest.originalSha256,
      fileSize: 0,
    };
  }

  // 2. Validate all blocks are provided
  if (encryptedBlockPayloads.size !== manifest.totalBlocks) {
    throw new Error(
      `Reconstruction error: Expected ${manifest.totalBlocks} blocks, but received only ${encryptedBlockPayloads.size}`
    );
  }

  // 3. Derive key from password and salt
  if (onProgress) onProgress(0, manifest.totalBlocks, 'Deriving AES-256-GCM key from password');
  const salt = base64ToBuffer(manifest.encryption.kdf.salt);
  const cryptoKey = await deriveKeyFromPassword(
    password,
    salt,
    manifest.encryption.kdf.iterations || PBKDF2_ITERATIONS
  );

  const decryptedChunks: ArrayBuffer[] = new Array(manifest.totalBlocks);

  // 4. Decrypt every block in order
  for (let i = 0; i < manifest.totalBlocks; i++) {
    if (abortSignal?.aborted) {
      throw new Error('Download / decryption cancelled');
    }

    const payload = encryptedBlockPayloads.get(i);
    if (!payload) {
      throw new Error(`Missing block payload at index ${i}`);
    }

    if (onProgress) {
      onProgress(i + 1, manifest.totalBlocks, `Authenticating & decrypting block ${i + 1} of ${manifest.totalBlocks}`);
    }

    const blockMeta = manifest.blocks[i];
    const explicitNonce = blockMeta?.nonce ? base64ToBuffer(blockMeta.nonce) : undefined;

    // Decrypt block - throws OperationError if tag fails (wrong password or altered data)
    const decryptedBuffer = await decryptBlock(
      payload,
      cryptoKey,
      manifest.fileId,
      i,
      manifest.totalBlocks,
      explicitNonce
    );

    // Verify plaintext block size
    if (blockMeta && decryptedBuffer.byteLength !== blockMeta.originalSize) {
      throw new Error(
        `Block #${i} length mismatch: expected ${blockMeta.originalSize} bytes, got ${decryptedBuffer.byteLength}`
      );
    }

    decryptedChunks[i] = decryptedBuffer;
  }

  // 5. Reconstruct Blob from ordered chunks
  if (onProgress) onProgress(manifest.totalBlocks, manifest.totalBlocks, 'Reconstructing binary file stream');
  const reconstructedBlob = new Blob(decryptedChunks, { type: manifest.fileType || 'application/octet-stream' });

  // 6. Compute SHA-256 checksum of the reconstructed file
  if (onProgress) onProgress(manifest.totalBlocks, manifest.totalBlocks, 'Verifying SHA-256 cryptographic checksum');
  const reconstructedSha256 = await computeBlobSha256(reconstructedBlob);

  const isIntegrityVerified = reconstructedSha256.toLowerCase() === manifest.originalSha256.toLowerCase();

  if (!isIntegrityVerified) {
    throw new Error(
      `CRITICAL INTEGRITY FAILURE: Reconstructed SHA-256 (${reconstructedSha256}) does not match trusted original digest (${manifest.originalSha256}). Decrypted data will not be delivered.`
    );
  }

  return {
    reconstructedBlob,
    reconstructedSha256,
    expectedSha256: manifest.originalSha256,
    isIntegrityVerified: true,
    fileSize: reconstructedBlob.size,
  };
}
