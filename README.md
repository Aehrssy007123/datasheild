# SecureVault Cloud 🛡️☁️
### Secure Cloud File Storage and Distribution Using File Segmentation, Encryption, and CDN

> **Bachelor of Engineering (B.E.) in Computer Engineering — Capstone / Mini-Project**  
> **Academic Year**: 2025 – 2026  
> **Status**: Production-Ready / Fully Verified  

---

## 📌 Executive Summary

**SecureVault Cloud** is an enterprise-grade, zero-knowledge cloud file storage and content distribution web application. It eliminates reliance on server-side trust by executing **authenticated cryptographic file segmentation** entirely within the client browser before objects ever touch cloud infrastructure.

Files are split into configurable discrete segments (256 KB, 512 KB, 1 MB, 5 MB), encrypted using **AES-256-GCM** with **Additional Authenticated Data (AAD)** binding each block's index and file ID, and derived via **PBKDF2-HMAC-SHA256** (100,000 iterations). Encrypted blocks are uploaded to a private **Amazon S3** bucket. Decryption authenticates every individual block, halting immediately on any tampering attempt, and reconstructs the file stream with mandatory **SHA-256** verification. The static dashboard application is deployed to an S3 private origin distributed globally via **Amazon CloudFront** with **Origin Access Control (OAC)** and **HTTPS**.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client_Browser ["Client Browser (Zero-Knowledge Zone)"]
        A[User Selects File] --> B[Compute Original SHA-256 Digest]
        B --> C[File Segmentation Engine\nN = ⌈FileSize / BlockSize⌉]
        C --> D[PBKDF2 Key Derivation\nPassword + 256-bit Salt, 100k iters]
        D --> E[AES-256-GCM Authenticated Encryption\nUnique 96-bit Nonce + AAD per Block]
        E --> F[Generate Authenticated Manifest\nBlocks Metadata + Nonces + Tags]
    end

    subgraph Backend_Gateway ["Backend Gateway (Express / Node.js)"]
        G[REST API Gateway\nZod Request Validation]
        H[Storage Adapter Factory\nAWS S3 or Local Adapter]
        G --> H
    end

    subgraph Cloud_Infrastructure ["Amazon Web Services (AWS)"]
        I[(Amazon S3 Private Bucket\nsecure-files/userId/fileId/)]
        J[CloudFront CDN\nEdge Cache Network]
        K[Origin Access Control\nOAC SigV4 Verification]
        J -->|Restricted SigV4 Read| K
        K -->|Private S3 Origin| I
    end

    F -->|Upload Block Payloads & Manifest| G
    H -->|PutObject / GetObject| I
    J -->|HTTPS / TLS 1.3 Static Delivery| User[End User Browser]
```

---

## 🔐 Cryptographic Specifications

| Primitive / Property | Specification | Standard | Purpose in SecureVault Cloud |
| :--- | :--- | :--- | :--- |
| **Cipher Algorithm** | **AES-256-GCM** | NIST SP 800-38D | Authenticated encryption providing confidentiality and integrity in hardware-accelerated parallel pipelines. |
| **Key Derivation** | **PBKDF2-HMAC-SHA256** | NIST SP 800-132 | 100,000 iterations with 256-bit unique cryptographic salt per file resisting brute-force and rainbow table attacks. |
| **Nonce (IV)** | **96-bit Cryptographic RNG** | NIST SP 800-90A | Strictly unique per block (`crypto.getRandomValues`); **never reused** under the same AES-GCM key. |
| **Authentication Tag** | **128-bit GHASH Tag** | NIST SP 800-38D | Appended to ciphertext; guarantees that even a 1-bit alteration aborts decryption immediately. |
| **Associated Data (AAD)** | `SecureVault\|v1\|file:{id}\|block:{i}\|total:{N}` | RFC 5116 | Cryptographically binds the block index and file ID to the ciphertext, preventing block transposition or splicing attacks. |
| **Integrity Digest** | **SHA-256** | FIPS PUB 180-4 | Full-file hash computed before upload and after reconstruction to guarantee 100% byte fidelity. |

---

## 📂 Amazon S3 Object Storage Layout

All files are stored in a private S3 bucket using an opaque, multi-tenant directory layout:

```text
secure-files/
  └── {userId}/
      └── {fileId}/
          ├── manifest.json       # Authenticated JSON manifest with salt, IVs, and tags
          └── blocks/
              ├── 000000.enc      # [12-byte Nonce] + [Ciphertext + 16-byte Tag]
              ├── 000001.enc
              ├── 000002.enc
              └── ...
```

---

## ⚡ Quick Start & Local Execution

SecureVault Cloud includes a dual-mode storage adapter. **If AWS credentials are not configured, it automatically runs in Local Object Storage mode**, persisting blocks to `.storage/s3-bucket` with zero cloud costs!

### 1. Prerequisites
- **Node.js**: v20.x or v24.x LTS (`node -v`)
- **npm**: v10.x+ (`npm -v`)
- **Python**: 3.x with `python-docx` (for DOCX report generation)

### 2. Installation
Clone the repository and install all dependencies:

```bash
# Install root orchestration dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 3. Run Development Servers (Concurrent)
Run both frontend and backend dev servers simultaneously with a single command:

```bash
npm run dev
```

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Cloud Status**: [http://localhost:5000/api/cloud/status](http://localhost:5000/api/cloud/status)

---

## 🧪 Automated Testing Suite

The project includes 14 unit and integration tests executing with **Vitest**:

```bash
# Run all tests
npm test
```

### Verified Test Results:

```text
 RUN  v3.2.7

 ✓ tests/integrity.test.ts (3 tests)
   ✓ SHA-256 Integrity Verification > should compute valid 64-character hexadecimal digests
   ✓ SHA-256 Integrity Verification > should detect when data has been altered by even one character
   ✓ SHA-256 Integrity Verification > should verify that a modified reconstructed payload fails SHA-256

 ✓ tests/crypto.test.ts (6 tests)
   ✓ Cryptographic Operations > should derive consistent AES-256-GCM keys from same password & salt
   ✓ Cryptographic Operations > should encrypt and decrypt a plaintext block successfully
   ✓ Cryptographic Operations > should fail decryption when using an incorrect password
   ✓ Cryptographic Operations > should reject decryption when even 1 bit of ciphertext is modified
   ✓ Cryptographic Operations > should reject decryption when block index in AAD does not match
   ✓ Cryptographic Operations > should generate unique 96-bit nonces for every block encryption

 ✓ tests/segmentation.test.ts (3 tests)
   ✓ File Segmentation Engine > should calculate correct block count for various sizes
   ✓ File Segmentation Engine > should segment binary buffer, encrypt, decrypt, and reassemble perfectly
   ✓ File Segmentation Engine > should handle empty binary files gracefully

 ✓ tests/integration.test.ts (2 tests)
   ✓ Storage Adapter Integration > should initialize and pass health check
   ✓ End-to-End Pipeline > should execute full lifecycle: Original File -> Slicing -> AES-GCM -> Storage -> Retrieval -> Decryption -> Reassembly -> SHA-256 Verification

 Test Files  4 passed (4)
      Tests  14 passed (14)
```

---

## ☁️ AWS S3 & CloudFront Deployment Guide

### 1. Configure `.env`
Copy `.env.example` to `.env` in the root directory:

```env
PORT=5000
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-private-s3-bucket
CLOUDFRONT_DOMAIN=d111111abcdef8.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
WEBSITE_HOSTING_BUCKET=your-website-hosting-bucket
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2. Deploy CloudFormation Stack (S3 + CloudFront OAC)
Deploy the infrastructure template located at `deployment/cloudfront-s3-oac.yaml`:

```bash
aws cloudformation deploy \
  --template-file deployment/cloudfront-s3-oac.yaml \
  --stack-name securevault-cloud-stack \
  --parameter-overrides ProjectName=securevault \
  --capabilities CAPABILITY_IAM
```

### 3. Deploy Frontend to S3 and Invalidate CloudFront
Build the client and sync to the website hosting bucket:

```bash
# Build React application
npm run build:client

# Sync assets to S3 and trigger CloudFront invalidation
node deployment/deploy-frontend.js
```

---

## 🎓 College Viva Voce Examination Cheat Sheet

| Question | Model Academic Answer |
| :--- | :--- |
| **Q1: Why choose AES-256-GCM over AES-CBC?** | AES-CBC requires separate MAC computation (Encrypt-then-MAC) to prevent padding oracle attacks. AES-GCM is an AEAD (Authenticated Encryption with Associated Data) mode that provides confidentiality AND authentication simultaneously without padding vulnerabilities. |
| **Q2: What is the purpose of Additional Authenticated Data (AAD)?** | AAD binds unencrypted metadata (like block index and file ID) to the ciphertext. The authentication tag validates both. If an adversary attempts to swap block 1 with block 2, AES-GCM tag verification fails immediately. |
| **Q3: What happens if a nonce is reused in AES-GCM?** | Nonce reuse allows an attacker to XOR two ciphertexts and recover the GHASH authentication key, completely destroying confidentiality and authenticity. SecureVault Cloud prevents this by generating a unique 96-bit random nonce for every single block. |
| **Q4: How does CloudFront OAC protect private S3 origins?** | OAC signs CloudFront requests using SigV4. The S3 bucket policy permits `s3:GetObject` only when the request principal is `cloudfront.amazonaws.com` and `AWS:SourceArn` matches the specific CloudFront distribution ARN, completely preventing direct public access to S3. |

---

## 📑 Project Deliverables

- **Frontend Application**: `client/` (React + Vite + TypeScript + Tailwind CSS)
- **Backend API**: `server/` (Express + TypeScript + AWS SDK v3)
- **Automated Test Suite**: `tests/` (14 Vitest unit and integration tests)
- **Cloud Infrastructure Template**: `deployment/cloudfront-s3-oac.yaml`
- **S3 Sync & Invalidation Script**: `deployment/deploy-frontend.js`
- **Academic Mini-Project Report**: `Secure_Cloud_Storage_Mini_Project_Report.docx` (Generated in root)
- **Report Generator**: `scripts/generate_report.py`

---

## 📜 License & Acknowledgments
Developed for Bachelor of Engineering in Computer Engineering.  
Complies with NIST SP 800-38D, NIST SP 800-132, and FIPS 180-4 cryptographic standards.
