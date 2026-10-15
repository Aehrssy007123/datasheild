import React from 'react';
import {
  BookOpen,
  Shield,
  Layers,
  KeyRound,
  FileCheck,
  Cpu,
  Boxes,
  HelpCircle,
  FileDown,
  Terminal,
  Server,
  Cloud,
} from 'lucide-react';

export const ProjectDocumentationPage: React.FC = () => {
  const vivaQuestions = [
    {
      q: 'Why use AES-256-GCM instead of AES-CBC or AES-ECB?',
      a: 'AES-ECB lacks semantic security and reveals patterns in plaintext. AES-CBC provides confidentiality but is vulnerable to padding oracle attacks if not combined with an HMAC (Encrypt-then-MAC). AES-GCM (Galois/Counter Mode) is an AEAD (Authenticated Encryption with Associated Data) scheme that provides confidentiality AND cryptographic authenticity simultaneously in hardware-accelerated parallel pipelines with zero padding vulnerabilities.',
    },
    {
      q: 'What is the purpose of Additional Authenticated Data (AAD)?',
      a: 'AAD allows binding unencrypted metadata (such as the block index, total blocks, and file ID) to the ciphertext. The authentication tag validates both the ciphertext and the AAD. If an adversary attempts to swap block 1 with block 2, or take a block from another file, AES-GCM tag verification will immediately fail.',
    },
    {
      q: 'Why is nonce reuse catastrophic in AES-GCM?',
      a: 'If two distinct blocks are encrypted under the same key using the same nonce (IV), an attacker can compute the XOR of the two plaintexts and recover the GHASH authentication key, destroying both confidentiality and authenticity. SecureVault Cloud prevents this by generating a unique 96-bit cryptographically secure random nonce for every single block.',
    },
    {
      q: 'Why combine SHA-256 with AES-GCM if AES-GCM already has an auth tag?',
      a: 'AES-GCM authenticates individual blocks under a secret password. SHA-256 provides an absolute, algorithmic digest of the entire original file. Verifying the reconstructed file against the trusted SHA-256 hash guarantees that the blocks were reassembled in exact order, no blocks were omitted, and the original unencrypted file was restored with 100% byte fidelity.',
    },
    {
      q: 'How does CloudFront Origin Access Control (OAC) secure the private S3 bucket?',
      a: 'With OAC, the S3 bucket is configured with all public access strictly blocked. CloudFront signs requests to S3 using SigV4 under its service principal (cloudfront.amazonaws.com). S3 validates that the incoming request originated specifically from the designated CloudFront distribution ARN, completely preventing users from bypassing the CDN to hit S3 directly.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-vault-100 tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-vault-bronze" /> Project Documentation & Academic Specifications
        </h2>
        <p className="text-sm text-vault-500 mt-1">
          Detailed cryptographic principles, algorithms, data flows, and viva voce evaluation guide for BE Computer
          Engineering submission.
        </p>
      </div>

      {/* Architecture Overview */}
      <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
        <h3 className="text-base font-semibold text-vault-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-vault-400" /> End-to-End System Architecture
        </h3>
        <p className="text-xs text-vault-400 leading-relaxed">
          The system architecture enforces zero-trust cloud file storage through client-side encryption. The backend and
          cloud object storage provider (Amazon S3) only ever see and store encrypted blocks and an authenticated JSON
          manifest.
        </p>

        <div className="p-4 rounded-xl bg-vault-950 border border-vault-800 font-mono text-xs text-vault-400 space-y-2">
          <div className="text-vault-400 font-semibold">// Upload Flow:</div>
          <div>1. File Selection &rarr; Compute SHA-256 Digest of Full File</div>
          <div>2. Slicing with Blob.slice &rarr; N = ⌈FileSize / BlockSize⌉</div>
          <div>3. PBKDF2(Password, 256-bit Salt, 100,000 Iterations) &rarr; 256-bit AES Key</div>
          <div>4. Per Block: Generate Unique 96-bit Nonce &rarr; Encrypt with AES-256-GCM + AAD</div>
          <div>5. Upload Encrypted Blocks [Nonce + Ciphertext + Tag] to S3 &rarr; Store Authenticated Manifest</div>
        </div>

        <div className="p-4 rounded-xl bg-vault-950 border border-vault-800 font-mono text-xs text-vault-400 space-y-2">
          <div className="text-vault-bronze font-semibold">// Download Flow:</div>
          <div>1. Fetch Authenticated Manifest from Object Storage</div>
          <div>2. Download Encrypted Blocks from S3 / Local Storage Adapter</div>
          <div>3. Derive Key: PBKDF2(User Password, Manifest Salt, 100,000 Iterations)</div>
          <div>4. Decrypt & Verify AES-GCM Tag for Each Block (Abort Immediately on Tag Error)</div>
          <div>5. Reconstruct Binary File Stream in Exact Block Order</div>
          <div>6. Compute Reconstructed SHA-256 & Compare with Manifest SHA-256 &rarr; Deliver File</div>
        </div>
      </div>

      {/* Cryptographic Primitives Table */}
      <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
        <h3 className="text-base font-semibold text-vault-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-400" /> Cryptographic Standard Compliance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-vault-400 font-sans">
            <thead className="bg-vault-950 text-vault-500 uppercase font-mono border-b border-vault-800">
              <tr>
                <th className="px-4 py-3">Primitive</th>
                <th className="px-4 py-3">Standard</th>
                <th className="px-4 py-3">Configuration</th>
                <th className="px-4 py-3">Security Property</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vault-800/60 font-mono">
              <tr>
                <td className="px-4 py-3 text-vault-400">AES-256-GCM</td>
                <td className="px-4 py-3 text-vault-400">NIST SP 800-38D</td>
                <td className="px-4 py-3">256-bit Key, 128-bit Tag</td>
                <td className="px-4 py-3 text-vault-400 font-sans">Confidentiality + Authenticity</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-vault-400">PBKDF2-HMAC</td>
                <td className="px-4 py-3 text-vault-400">NIST SP 800-132</td>
                <td className="px-4 py-3">100,000 Iterations, SHA-256</td>
                <td className="px-4 py-3 text-vault-400 font-sans">Key Derivation & Brute-force Resistance</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-vault-400">SHA-256</td>
                <td className="px-4 py-3 text-vault-400">FIPS 180-4</td>
                <td className="px-4 py-3">256-bit Digest</td>
                <td className="px-4 py-3 text-vault-400 font-sans">End-to-End Integrity Verification</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-vault-400">Nonce Generation</td>
                <td className="px-4 py-3 text-vault-400">NIST SP 800-90A</td>
                <td className="px-4 py-3">96-bit Cryptographic RNG</td>
                <td className="px-4 py-3 text-vault-400 font-sans">Uniqueness per Block Encryption</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* College Viva Voce Questions & Answers */}
      <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
        <h3 className="text-base font-semibold text-vault-100 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" /> Viva Voce Examination Questions & Answers
        </h3>
        <p className="text-xs text-vault-500">
          Key questions frequently asked by external examiners during final-year engineering project evaluation:
        </p>

        <div className="space-y-4">
          {vivaQuestions.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-vault-850/70 border border-vault-800 space-y-2">
              <div className="text-sm font-semibold text-vault-400 flex items-start gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-vault-bronze/10 border border-vault-700/50">
                  Q{idx + 1}
                </span>
                <span>{item.q}</span>
              </div>
              <div className="text-xs text-vault-400 leading-relaxed pl-8">{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Project Report Document Reference */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-vault-800/40 via-vault-900 to-vault-900 border border-vault-600/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-vault-bronze" />
              <h3 className="text-base font-semibold text-vault-100">College Mini-Project Report (DOCX)</h3>
            </div>
            <p className="text-xs text-vault-400 mt-1 max-w-xl">
              A comprehensive academic report named <code className="text-vault-400 font-mono">Secure_Cloud_Storage_Mini_Project_Report.docx</code> is generated in the project root with complete chapters, literature review, DFDs, and references.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
