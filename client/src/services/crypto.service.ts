/**
 * SecureVault Cloud - Cryptographic Service
 * Implements client-side AES-256-GCM authenticated encryption,
 * PBKDF2 key derivation, cryptographically secure nonces/salts,
 * Additional Authenticated Data (AAD) binding, and SHA-256 verification.
 */

// Recommended iteration count per OWASP / NIST SP 800-132 for PBKDF2-HMAC-SHA256
export const PBKDF2_ITERATIONS = 100000;
export const AES_KEY_LENGTH = 256;
export const NONCE_LENGTH_BYTES = 12; // 96 bits for AES-GCM
export const SALT_LENGTH_BYTES = 32;  // 256 bits salt
export const TAG_LENGTH_BITS = 128;   // 16 bytes auth tag

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
    return (globalThis as any).crypto;
  }
  throw new Error('Web Crypto API is not available in this environment');
}

function safeBtoa(binary: string): string {
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(binary);
  }
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(binary, 'binary').toString('base64');
  }
  return '';
}

function safeAtob(base64: string): string {
  if (typeof window !== 'undefined' && window.atob) {
    return window.atob(base64);
  }
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(base64, 'base64').toString('binary');
  }
  return '';
}

/**
 * Convert ArrayBuffer to Hex string
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Convert Hex string to Uint8Array
 */
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert ArrayBuffer or Uint8Array to Base64 string
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return safeBtoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = safeAtob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  getCrypto().getRandomValues(array);
  return array;
}

/**
 * Compute SHA-256 digest of an ArrayBuffer or Uint8Array
 * Returns lowercase hexadecimal string
 */
export async function computeSha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const hashBuffer = await getCrypto().subtle.digest('SHA-256', data as any);
  return bufferToHex(hashBuffer);
}

/**
 * Compute SHA-256 digest of a File or Blob
 */
export async function computeBlobSha256(blob: Blob, onProgress?: (processed: number, total: number) => void): Promise<string> {
  const buffer = await blob.arrayBuffer();
  if (onProgress) onProgress(blob.size, blob.size);
  return computeSha256(buffer);
}

/**
 * Derive AES-256-GCM CryptoKey from password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await getCrypto().subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return getCrypto().subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    false, // Do not allow key extraction
    ['encrypt', 'decrypt']
  );
}

/**
 * Create Additional Authenticated Data (AAD) for a block
 * Binds the block index, file ID, and total blocks to the ciphertext
 * preventing block transposition or splicing attacks.
 */
export function createBlockAad(fileId: string, blockIndex: number, totalBlocks: number): Uint8Array {
  const enc = new TextEncoder();
  return enc.encode(`SecureVault|v1|file:${fileId}|block:${blockIndex}|total:${totalBlocks}`);
}

export interface EncryptedBlockResult {
  nonce: Uint8Array;
  ciphertextWithTag: ArrayBuffer;
  combinedPayload: Uint8Array; // [12-byte IV] + [Ciphertext + Tag]
  tag: Uint8Array; // Extracted 16-byte tag
  sha256Plaintext: string;
}

/**
 * Encrypt a single block using AES-256-GCM
 */
export async function encryptBlock(
  plaintextBuffer: ArrayBuffer,
  key: CryptoKey,
  fileId: string,
  blockIndex: number,
  totalBlocks: number
): Promise<EncryptedBlockResult> {
  // 1. Generate unique 12-byte nonce (CRITICAL: Must never be reused!)
  const nonce = generateRandomBytes(NONCE_LENGTH_BYTES);
  
  // 2. Compute plaintext block hash for integrity tracking
  const sha256Plaintext = await computeSha256(plaintextBuffer);

  // 3. Create Additional Authenticated Data
  const aad = createBlockAad(fileId, blockIndex, totalBlocks);

  // 4. Perform AES-GCM encryption
  const ciphertextWithTag = await getCrypto().subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce as any,
      additionalData: aad as any,
      tagLength: TAG_LENGTH_BITS,
    },
    key,
    plaintextBuffer
  );

  // Web Crypto appends the 16-byte authentication tag to the end of ciphertext
  const ciphertextBytes = new Uint8Array(ciphertextWithTag);
  const tagStart = ciphertextBytes.length - 16;
  const tag = ciphertextBytes.slice(tagStart);

  // 5. Pack into combined payload: [12-byte nonce] + [ciphertext + tag]
  const combinedPayload = new Uint8Array(NONCE_LENGTH_BYTES + ciphertextBytes.length);
  combinedPayload.set(nonce, 0);
  combinedPayload.set(ciphertextBytes, NONCE_LENGTH_BYTES);

  return {
    nonce,
    ciphertextWithTag,
    combinedPayload,
    tag,
    sha256Plaintext,
  };
}

/**
 * Decrypt a single block using AES-256-GCM
 * Throws an error if authentication fails (wrong password or modified ciphertext/AAD)
 */
export async function decryptBlock(
  encryptedData: ArrayBuffer | Uint8Array,
  key: CryptoKey,
  fileId: string,
  blockIndex: number,
  totalBlocks: number,
  explicitNonce?: Uint8Array
): Promise<ArrayBuffer> {
  const dataBytes = encryptedData instanceof Uint8Array ? encryptedData : new Uint8Array(encryptedData);

  let nonce: Uint8Array;
  let ciphertextWithTag: Uint8Array;

  if (explicitNonce) {
    nonce = explicitNonce;
    ciphertextWithTag = dataBytes;
  } else {
    // If packaged as [12-byte nonce] + [ciphertext + tag]
    if (dataBytes.length < NONCE_LENGTH_BYTES + 16) {
      throw new Error(`Invalid block payload: length ${dataBytes.length} bytes is less than minimum header`);
    }
    nonce = dataBytes.slice(0, NONCE_LENGTH_BYTES);
    ciphertextWithTag = dataBytes.slice(NONCE_LENGTH_BYTES);
  }

  // Create identical AAD to verify authentication
  const aad = createBlockAad(fileId, blockIndex, totalBlocks);

  try {
    const plaintext = await getCrypto().subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce as any,
        additionalData: aad as any,
        tagLength: TAG_LENGTH_BITS,
      },
      key,
      ciphertextWithTag as any
    );
    return plaintext;
  } catch (err) {
    throw new Error(
      `Decryption failed for block #${blockIndex}: AES-GCM authentication tag mismatch. ` +
      `Check your password, or block integrity may have been compromised.`
    );
  }
}
