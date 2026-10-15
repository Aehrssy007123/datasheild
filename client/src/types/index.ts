export type BlockSizeOption = 262144 | 524288 | 1048576 | 5242880; // 256KB, 512KB, 1MB, 5MB

export interface KdfParameters {
  name: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
  salt: string; // Base64 encoded
}

export interface EncryptionParameters {
  algorithm: 'AES-256-GCM';
  tagLength: number; // 128 bits
  kdf: KdfParameters;
}

export interface BlockMetadata {
  index: number;
  originalSize: number;
  ciphertextSize: number;
  nonce: string; // Base64 encoded 12-byte IV
  tag: string; // Base64 encoded 16-byte authentication tag
  sha256Plaintext?: string;
  storageKey: string;
}

export interface FileManifest {
  version: '1.0.0';
  fileId: string;
  userId: string;
  fileName: string;
  fileType: string;
  originalSize: number;
  originalSha256: string;
  blockSize: number;
  totalBlocks: number;
  createdAt: string;
  encryption: EncryptionParameters;
  blocks: BlockMetadata[];
  manifestHash: string; // Integrity hash of manifest parameters
}

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

export interface UploadProgressState {
  stage: 'idle' | 'segmenting' | 'encrypting' | 'uploading' | 'verifying' | 'completed' | 'cancelled' | 'error';
  currentBlock: number;
  totalBlocks: number;
  bytesProcessed: number;
  totalBytes: number;
  percentage: number;
  message: string;
  error?: string;
}

export interface DownloadProgressState {
  stage: 'idle' | 'fetching_manifest' | 'downloading_blocks' | 'deriving_key' | 'decrypting' | 'reconstructing' | 'verifying_hash' | 'completed' | 'error';
  currentBlock: number;
  totalBlocks: number;
  percentage: number;
  message: string;
  error?: string;
}

export interface CloudStatusInfo {
  storageProvider: 's3' | 'local';
  isAwsConfigured: boolean;
  awsRegion: string;
  s3BucketName: string;
  bucketAccessible: boolean;
  cloudFrontDomain: string;
  cloudFrontConfigured: boolean;
  totalFiles: number;
  totalOriginalBytes: number;
  totalBlocks: number;
  serverTimestamp: string;
}

export interface LatencyTestResult {
  url: string;
  type: 'cdn' | 'origin';
  status: number;
  statusText: string;
  durationMs: number;
  ttfbMs: number;
  xCacheHeader?: string;
  ageHeader?: string;
  timestamp: string;
}
