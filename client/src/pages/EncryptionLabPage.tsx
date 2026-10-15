import React, { useState } from 'react';
import {
  Cpu,
  Shield,
  KeyRound,
  FileCode,
  Boxes,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Hash,
  Binary,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  deriveKeyFromPassword,
  encryptBlock,
  decryptBlock,
  computeSha256,
  generateRandomBytes,
  bufferToHex,
  bufferToBase64,
  SALT_LENGTH_BYTES,
  PBKDF2_ITERATIONS,
} from '../services/crypto.service';

interface LabBlock {
  index: number;
  originalSize: number;
  ciphertextSize: number;
  nonceHex: string;
  tagHex: string;
  sha256Plaintext: string;
  ciphertextPreviewHex: string;
  rawEncrypted: Uint8Array;
  corrupted: boolean;
}

export const EncryptionLabPage: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    'SecureVault Cloud combines client-side authenticated encryption (AES-256-GCM) with segmented block distribution. ' +
    'Each block is independently keyed, nonced, and authenticated. Even the cloud storage provider cannot inspect the plaintext!'
  );
  const [labPassword, setLabPassword] = useState<string>('VaultSecretDemo2026!');
  const [labBlockSize, setLabBlockSize] = useState<number>(64); // 64 bytes for clear demonstration
  const [blocks, setBlocks] = useState<LabBlock[]>([]);
  const [saltHex, setSaltHex] = useState<string>('');
  const [originalHash, setOriginalHash] = useState<string>('');
  const [labCryptoKey, setLabCryptoKey] = useState<CryptoKey | null>(null);
  const [reconstructedText, setReconstructedText] = useState<string>('');
  const [reconstructionStatus, setReconstructionStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'interactive' | 'theory'>('interactive');

  const runLabEncryption = async () => {
    if (!inputText) return;

    try {
      const enc = new TextEncoder();
      const plaintextBytes = enc.encode(inputText);

      // Compute SHA-256 of full plaintext
      const hash = await computeSha256(plaintextBytes);
      setOriginalHash(hash);

      // Generate 32-byte salt
      const salt = generateRandomBytes(SALT_LENGTH_BYTES);
      setSaltHex(bufferToHex(salt));

      // Derive key
      const key = await deriveKeyFromPassword(labPassword, salt, PBKDF2_ITERATIONS);
      setLabCryptoKey(key);

      const totalBlocks = Math.ceil(plaintextBytes.length / labBlockSize);
      const generatedBlocks: LabBlock[] = [];

      for (let i = 0; i < totalBlocks; i++) {
        const start = i * labBlockSize;
        const end = Math.min(start + labBlockSize, plaintextBytes.length);
        const chunk = plaintextBytes.slice(start, end);

        const encrypted = await encryptBlock(chunk.buffer as ArrayBuffer, key, 'lab-sample', i, totalBlocks);

        generatedBlocks.push({
          index: i,
          originalSize: chunk.length,
          ciphertextSize: encrypted.ciphertextWithTag.byteLength,
          nonceHex: bufferToHex(encrypted.nonce),
          tagHex: bufferToHex(encrypted.tag),
          sha256Plaintext: encrypted.sha256Plaintext,
          ciphertextPreviewHex: bufferToHex(new Uint8Array(encrypted.ciphertextWithTag).slice(0, 16)) + '...',
          rawEncrypted: encrypted.combinedPayload,
          corrupted: false,
        });
      }

      setBlocks(generatedBlocks);
      setReconstructedText('');
      setReconstructionStatus('');
    } catch (err: any) {
      console.error('Lab encryption error:', err);
    }
  };

  const handleCorruptBlock = (blockIndex: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.index === blockIndex) {
          // Flip one byte in the payload
          const newPayload = new Uint8Array(b.rawEncrypted);
          newPayload[14] ^= 0x01; // flip lowest bit
          return {
            ...b,
            rawEncrypted: newPayload,
            corrupted: true,
          };
        }
        return b;
      })
    );
  };

  const runLabReconstruction = async () => {
    if (!labCryptoKey || blocks.length === 0) return;

    try {
      const decryptedParts: ArrayBuffer[] = [];
      const totalBlocks = blocks.length;

      for (let i = 0; i < totalBlocks; i++) {
        const b = blocks[i];
        // Decrypt - will throw if tag fails
        const decryptedChunk = await decryptBlock(b.rawEncrypted, labCryptoKey, 'lab-sample', i, totalBlocks);
        decryptedParts.push(decryptedChunk);
      }

      const dec = new TextDecoder();
      let combined = '';
      for (const part of decryptedParts) {
        combined += dec.decode(part, { stream: true });
      }
      combined += dec.decode(); // flush

      setReconstructedText(combined);
      setReconstructionStatus('SUCCESS: All block tags authenticated & text reconstructed identically!');
    } catch (err: any) {
      setReconstructedText('');
      setReconstructionStatus(`AUTHENTICATION ERROR: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-vault-100 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-vault-bronze" /> Cryptography & Segmentation Lab
          </h2>
          <p className="text-sm text-vault-500 mt-1">
            Deep dive into AES-256-GCM, PBKDF2 key derivation, 96-bit nonces, Poly1305/GHASH authentication tags, and
            Additional Authenticated Data (AAD).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-vault-900 border border-vault-800">
          <button
            onClick={() => setActiveTab('interactive')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'interactive'
                ? 'bg-vault-bronze/15 text-vault-400 border border-vault-700/60'
                : 'text-vault-500 hover:text-vault-100'
            }`}
          >
            Interactive Sandbox
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'theory'
                ? 'bg-vault-bronze/15 text-vault-400 border border-vault-700/60'
                : 'text-vault-500 hover:text-vault-100'
            }`}
          >
            NIST & Cryptographic Theory
          </button>
        </div>
      </div>

      {activeTab === 'interactive' ? (
        <div className="space-y-6">
          {/* Input Controls */}
          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
            <h3 className="text-base font-semibold text-vault-100">1. Input Plaintext & Parameters</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-vault-500 block mb-1">Plaintext Message</label>
                <textarea
                  rows={3}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-vault-850 border border-vault-700 text-vault-100 font-mono text-xs focus:outline-none focus:border-vault-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-vault-500 block mb-1">Passphrase (PBKDF2 input)</label>
                  <input
                    type="text"
                    value={labPassword}
                    onChange={(e) => setLabPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-vault-850 border border-vault-700 text-vault-100 font-mono text-xs focus:outline-none focus:border-vault-accent"
                  />
                </div>
                <div>
                  <label className="text-xs text-vault-500 block mb-1">
                    Block Size (Bytes) &mdash; smaller block size creates more segments
                  </label>
                  <select
                    value={labBlockSize}
                    onChange={(e) => setLabBlockSize(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-vault-850 border border-vault-700 text-vault-100 font-mono text-xs focus:outline-none focus:border-vault-accent"
                  >
                    <option value={32}>32 Bytes (Fine Grain)</option>
                    <option value={64}>64 Bytes (Recommended for Demo)</option>
                    <option value={128}>128 Bytes</option>
                    <option value={256}>256 Bytes</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={runLabEncryption}
              className="px-5 py-2.5 rounded-xl bg-vault-accent hover:bg-vault-copper text-vault-950 font-bold text-xs transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Execute Live Slicing & AES-256-GCM Encryption
            </button>
          </div>

          {/* Generated Cryptographic Blocks Table */}
          {blocks.length > 0 && (
            <div className="rounded-2xl bg-vault-900 border border-vault-800 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-vault-800 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-vault-100">2. Segmented Block Inspection</h3>
                  <p className="text-xs text-vault-500">
                    Each block has its own 12-byte IV/nonce and 16-byte authentication tag
                  </p>
                </div>
                <div className="text-xs font-mono text-vault-500">
                  Total Segments: <span className="text-vault-400 font-bold">{blocks.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-vault-400">
                  <thead className="bg-vault-950/80 uppercase text-vault-600 border-b border-vault-800">
                    <tr>
                      <th className="px-4 py-3">Block #</th>
                      <th className="px-4 py-3">Original Size</th>
                      <th className="px-4 py-3">Nonce (IV, 96-bit Hex)</th>
                      <th className="px-4 py-3">Auth Tag (128-bit Hex)</th>
                      <th className="px-4 py-3">Ciphertext Sample</th>
                      <th className="px-4 py-3 text-right">Tamper Test</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vault-800/60">
                    {blocks.map((b) => (
                      <tr key={b.index} className={b.corrupted ? 'bg-rose-500/10' : 'hover:bg-vault-850/40'}>
                        <td className="px-4 py-3 font-bold text-vault-100">
                          #{b.index} {b.corrupted && <span className="text-rose-400 text-[10px]">(CORRUPTED)</span>}
                        </td>
                        <td className="px-4 py-3">{b.originalSize} B</td>
                        <td className="px-4 py-3 text-vault-bronze">{b.nonceHex}</td>
                        <td className="px-4 py-3 text-emerald-400">{b.tagHex}</td>
                        <td className="px-4 py-3 text-vault-500">{b.ciphertextPreviewHex}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleCorruptBlock(b.index)}
                            disabled={b.corrupted}
                            className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition ${
                              b.corrupted
                                ? 'bg-rose-500/20 text-rose-400 cursor-not-allowed'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {b.corrupted ? 'Tampered' : 'Flip 1 Bit'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Interactive Ciphertext Hex Byte Matrix */}
              <div className="p-4 rounded-xl bg-vault-950/80 border border-vault-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-vault-400 flex items-center gap-1.5 font-sans">
                    <Binary className="w-4 h-4 text-vault-400" /> Interactive Block #0 Ciphertext Byte Matrix (Click byte to corrupt)
                  </span>
                  <span className="text-[11px] font-mono text-vault-600">
                    NIST SP 800-38D GHASH Galois Field Authentication
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-vault-900 border border-vault-800/80 font-mono text-xs">
                  {Array.from(blocks[0].rawEncrypted.slice(0, 32)).map((byte, idx) => {
                    const isTampered = blocks[0].corrupted && idx === 14;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCorruptBlock(0)}
                        className={`px-2 py-1 rounded transition-all select-none ${
                          isTampered
                            ? 'bg-rose-500 text-vault-100 font-bold shadow-glow-rose animate-bounce'
                            : 'bg-vault-850 hover:bg-vault-bronze/15 text-vault-400 hover:text-vault-300 border border-vault-700/60'
                        }`}
                        title={`Byte index #${idx} (Value: 0x${byte.toString(16).padStart(2, '0')}) - Click to flip bit`}
                      >
                        {byte.toString(16).padStart(2, '0')}
                      </button>
                    );
                  })}
                  <span className="text-vault-700 self-center pl-2">... (total {blocks[0].rawEncrypted.length} bytes)</span>
                </div>
                <p className="text-[11px] text-vault-500">
                  Tip: In AES-256-GCM, flipping even 1 bit in the ciphertext above immediately invalidates the 16-byte Poly/GHASH tag.
                </p>
              </div>

              {/* Decrypt and Reconstruct Section */}
              <div className="pt-4 border-t border-vault-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-vault-100">3. Reconstruct & Authenticate</h4>
                  <button
                    onClick={runLabReconstruction}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-vault-950 font-bold text-xs transition"
                  >
                    Test Decryption & Tag Verification
                  </button>
                </div>

                {reconstructionStatus && (
                  <div
                    className={`p-4 rounded-xl border text-xs font-mono ${
                      reconstructionStatus.startsWith('SUCCESS')
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="font-bold mb-1">{reconstructionStatus}</div>
                    {reconstructedText && (
                      <div className="mt-2 p-3 rounded bg-vault-950 border border-vault-800 text-vault-100 font-mono">
                        {reconstructedText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* NIST & Cryptographic Theory Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-3">
            <h3 className="text-base font-semibold text-vault-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-vault-400" /> AES-256-GCM (Galois/Counter Mode)
            </h3>
            <p className="text-xs text-vault-400 leading-relaxed">
              AES-GCM is an Authenticated Encryption with Associated Data (AEAD) scheme standardized in NIST SP 800-38D.
              It pairs AES counter mode encryption with a GHASH universal hash function over GF(2^128) to provide both
              confidentiality and cryptographic integrity.
            </p>
            <div className="p-3 rounded-xl bg-vault-950 border border-vault-800 font-mono text-xs text-vault-300 space-y-1">
              <div>&bull; Key Size: 256 bits (32 bytes)</div>
              <div>&bull; Nonce (IV): 96 bits (12 bytes) &mdash; NEVER reused!</div>
              <div>&bull; Auth Tag: 128 bits (16 bytes)</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-3">
            <h3 className="text-base font-semibold text-vault-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-vault-bronze" /> PBKDF2 Key Derivation
            </h3>
            <p className="text-xs text-vault-400 leading-relaxed">
              Password-Based Key Derivation Function 2 (NIST SP 800-132) converts a user-provided passphrase into a
              cryptographic key of uniform randomness. By applying HMAC-SHA-256 iteratively with a 256-bit random salt,
              it prevents rainbow table attacks and resists offline brute-force attacks.
            </p>
            <div className="p-3 rounded-xl bg-vault-950 border border-vault-800 font-mono text-xs text-vault-400 space-y-1">
              <div>&bull; Iterations: 100,000 (OWASP Recommendation)</div>
              <div>&bull; Salt: Cryptographically random 32 bytes per file</div>
              <div>&bull; Pseudo-Random Function: HMAC-SHA-256</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-3">
            <h3 className="text-base font-semibold text-vault-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" /> Additional Authenticated Data (AAD)
            </h3>
            <p className="text-xs text-vault-400 leading-relaxed">
              AAD allows authenticating metadata without encrypting it. In SecureVault Cloud, each block passes:
              <br />
              <code className="text-violet-300 bg-vault-950 px-2 py-0.5 rounded text-[11px] block mt-1">
                fileId: &#123;id&#125; | blockIndex: &#123;i&#125; | totalBlocks: &#123;N&#125;
              </code>
              This binds the block index to the ciphertext. An attacker cannot swap block 1 with block 2 without failing
              tag verification!
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-3">
            <h3 className="text-base font-semibold text-vault-100 flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" /> SHA-256 vs Authenticated Encryption
            </h3>
            <p className="text-xs text-vault-400 leading-relaxed">
              SHA-256 is an unkeyed cryptographic hash function: it verifies that data has not changed unintentionally.
              However, SHA-256 alone does not provide secrecy (confidentiality) or prevent an active attacker from
              replacing both the data and the hash. AES-GCM tags provide authenticated integrity under a secret key.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
