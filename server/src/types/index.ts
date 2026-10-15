import { z } from 'zod';

export const BlockMetadataSchema = z.object({
  index: z.number().int().nonnegative(),
  originalSize: z.number().int().nonnegative(),
  ciphertextSize: z.number().int().nonnegative(),
  nonce: z.string().min(1),
  tag: z.string().min(1),
  sha256Plaintext: z.string().optional(),
  storageKey: z.string().min(1),
});

export const FileManifestSchema = z.object({
  version: z.literal('1.0.0'),
  fileId: z.string().min(1),
  userId: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string(),
  originalSize: z.number().int().nonnegative(),
  originalSha256: z.string().length(64),
  blockSize: z.number().int().positive(),
  totalBlocks: z.number().int().nonnegative(),
  createdAt: z.string(),
  encryption: z.object({
    algorithm: z.literal('AES-256-GCM'),
    tagLength: z.literal(128),
    kdf: z.object({
      name: z.literal('PBKDF2'),
      hash: z.literal('SHA-256'),
      iterations: z.number().int().positive(),
      salt: z.string().min(1),
    }),
  }),
  blocks: z.array(BlockMetadataSchema),
  manifestHash: z.string().min(1),
});

export type FileManifest = z.infer<typeof FileManifestSchema>;
export type BlockMetadata = z.infer<typeof BlockMetadataSchema>;

export interface FileRecord {
  fileId: string;
  userId: string;
  fileName: string;
  fileType: string;
  originalSize: number;
  blockSize: number;
  totalBlocks: number;
  originalSha256: string;
  createdAt: string;
  encryptionAlgorithm: string;
  storageProvider: 's3' | 'local';
  cloudStatus: 'stored' | 'uploading' | 'error';
  integrityStatus: 'verified' | 'unverified' | 'corrupted';
}
