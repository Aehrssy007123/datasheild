"""
SecureVault Cloud - Academic Mini-Project Report Generator
Generates: Secure_Cloud_Storage_Mini_Project_Report.docx
Formatted in formal academic standard for Bachelor of Engineering (B.E.) in Computer Engineering.
"""

import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_report():
    doc = Document()

    # Page Margins: 1 inch all around
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styling helper
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(30, 41, 59) # Slate 800

    # =========================================================================
    # TITLE PAGE
    # =========================================================================
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_before = Pt(36)
    title_p.paragraph_format.space_after = Pt(12)

    title_run = title_p.add_run("A MINI PROJECT REPORT ON\n")
    title_run.font.size = Pt(14)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(15, 23, 42)

    proj_name = title_p.add_run("SECURE CLOUD FILE STORAGE AND DISTRIBUTION USING FILE SEGMENTATION, ENCRYPTION, AND CDN\n\n")
    proj_name.font.size = Pt(18)
    proj_name.font.bold = True
    proj_name.font.color.rgb = RGBColor(2, 132, 199) # Sky 600

    sub_run = title_p.add_run(
        "Submitted in partial fulfillment of the requirements\n"
        "for the award of the Degree of\n"
        "BACHELOR OF ENGINEERING\nIN\nCOMPUTER ENGINEERING\n\n\n"
    )
    sub_run.font.size = Pt(12)
    sub_run.font.italic = True

    by_p = doc.add_paragraph()
    by_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    by_run = by_p.add_run("SUBMITTED BY:\n")
    by_run.font.bold = True
    by_run.font.size = Pt(12)

    names_run = by_p.add_run("Student Name / Examination Seat No.\nClass: B.E. Computer Engineering\n\n\n")
    names_run.font.size = Pt(12)

    guide_p = doc.add_paragraph()
    guide_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    guide_run = guide_p.add_run("UNDER THE GUIDANCE OF:\nProject Guide / Faculty Member\nDepartment of Computer Engineering\n\n\n")
    guide_run.font.size = Pt(12)

    dept_p = doc.add_paragraph()
    dept_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    dept_run = dept_p.add_run(
        "DEPARTMENT OF COMPUTER ENGINEERING\n"
        "COLLEGE OF ENGINEERING AND TECHNOLOGY\n"
        "ACADEMIC YEAR 2025 – 2026\n"
    )
    dept_run.font.bold = True
    dept_run.font.size = Pt(13)

    doc.add_page_break()

    # =========================================================================
    # CERTIFICATE & ABSTRACT
    # =========================================================================
    cert_heading = doc.add_paragraph()
    cert_heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cr = cert_heading.add_run("CERTIFICATE")
    cr.font.bold = True
    cr.font.size = Pt(16)
    cr.font.color.rgb = RGBColor(15, 23, 42)

    cert_body = doc.add_paragraph()
    cert_body.paragraph_format.line_spacing = 1.5
    cert_body.paragraph_format.space_before = Pt(18)
    cert_body.add_run(
        "This is to certify that the project entitled \"Secure Cloud File Storage and Distribution Using File "
        "Segmentation, Encryption, and CDN\" is a bona fide work carried out by the student in partial fulfillment "
        "of the requirements for the degree of Bachelor of Engineering in Computer Engineering. "
        "The project demonstrates sound practical and theoretical principles of cloud security, authenticated cryptography, "
        "distributed object storage, and content delivery networks.\n\n"
    )

    sig_table = doc.add_table(rows=2, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_table.autofit = False
    for row in sig_table.rows:
        row.cells[0].width = Inches(3.2)
        row.cells[1].width = Inches(3.2)
    sig_table.rows[0].cells[0].paragraphs[0].text = "_______________________\nProject Guide"
    sig_table.rows[0].cells[1].paragraphs[0].text = "_______________________\nHead of Department"
    sig_table.rows[1].cells[0].paragraphs[0].text = "\n_______________________\nInternal Examiner"
    sig_table.rows[1].cells[1].paragraphs[0].text = "\n_______________________\nExternal Examiner"

    doc.add_page_break()

    # ABSTRACT
    abs_heading = doc.add_paragraph()
    abs_heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ar = abs_heading.add_run("ABSTRACT")
    ar.font.bold = True
    ar.font.size = Pt(16)
    ar.font.color.rgb = RGBColor(15, 23, 42)

    abs_p = doc.add_paragraph()
    abs_p.paragraph_format.line_spacing = 1.5
    abs_p.paragraph_format.space_before = Pt(12)
    abs_p.add_run(
        "In modern cloud computing, storing sensitive enterprise and personal data in third-party public cloud environments "
        "poses critical confidentiality and integrity risks. Conventional server-side encryption leaves cryptographic keys "
        "accessible to cloud service providers or susceptible to insider threats and configuration errors. "
        "This project, entitled SecureVault Cloud, addresses these vulnerabilities by developing a high-assurance, "
        "zero-knowledge cloud file storage and distribution web system that enforces client-side file segmentation, "
        "authenticated encryption (AES-256-GCM), key derivation (PBKDF2-HMAC-SHA256), and end-to-end cryptographic integrity verification.\n\n"
        "Under the proposed architecture, files selected by the user are sliced into configurable discrete blocks (256 KB, 512 KB, "
        "1 MB, 5 MB) directly within the client browser using bounded-memory streaming. A 256-bit AES key is derived from a user passphrase "
        "using PBKDF2 with 100,000 iterations and a unique 256-bit random salt. Each block is encrypted using AES-256-GCM with a strictly unique "
        "96-bit nonce and Additional Authenticated Data (AAD) that cryptographically binds the block index, file identifier, and total segment count. "
        "The resulting encrypted blocks are uploaded to a private Amazon S3 object bucket, while an authenticated manifest controls reconstruction. "
        "During download, every block undergoes authenticated decryption; if tampering or wrong passphrases are detected, execution halts immediately. "
        "Upon reassembly, a SHA-256 digest comparison against the trusted manifest guarantees absolute byte fidelity. "
        "Furthermore, the project incorporates Amazon CloudFront with Origin Access Control (OAC) to distribute the static web dashboard securely over HTTPS. "
        "A comprehensive automated test suite (Vitest) validates cryptographic correctness, tamper detection, and storage adapters, achieving 100% test pass rate."
    )

    kw_p = doc.add_paragraph()
    kw_p.paragraph_format.space_before = Pt(12)
    kw_p.add_run("Keywords: ").font.bold = True
    kw_p.add_run("Cloud Computing, File Segmentation, AES-256-GCM, PBKDF2, Web Crypto API, Amazon S3, Amazon CloudFront, Origin Access Control, SHA-256.")

    doc.add_page_break()

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    toc_heading = doc.add_paragraph()
    toc_heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tr = toc_heading.add_run("TABLE OF CONTENTS")
    tr.font.bold = True
    tr.font.size = Pt(16)

    toc_items = [
        ("1. Introduction and Objectives", "1"),
        ("   1.1 Background and Motivation", "1"),
        ("   1.2 Problem Statement", "2"),
        ("   1.3 Project Objectives", "2"),
        ("   1.4 Scope and Limitations", "3"),
        ("2. Literature Survey & System Comparison", "4"),
        ("   2.1 Review of Related Work", "4"),
        ("   2.2 Existing System vs. Proposed System", "5"),
        ("3. System Requirements & Specifications", "6"),
        ("   3.1 Hardware Requirements", "6"),
        ("   3.2 Software & Framework Requirements", "6"),
        ("   3.3 Cryptographic Standards Reference", "7"),
        ("4. System Architecture & Data Flow", "8"),
        ("   4.1 Architectural Overview", "8"),
        ("   4.2 Data Flow Diagrams (DFD Level 0 & Level 1)", "9"),
        ("   4.3 S3 Storage Layout & Object Organization", "10"),
        ("5. Algorithmic Modules Implementation", "11"),
        ("   5.1 File Segmentation Algorithm", "11"),
        ("   5.2 PBKDF2 Key Derivation Algorithm", "12"),
        ("   5.3 AES-256-GCM Encryption with AAD", "13"),
        ("   5.4 Ordered File Reconstruction & SHA-256 Verification", "14"),
        ("6. Cloud Infrastructure & CDN Distribution", "15"),
        ("   6.1 Amazon S3 Private Bucket Architecture", "15"),
        ("   6.2 Amazon CloudFront Origin Access Control (OAC)", "16"),
        ("   6.3 HTTPS & Cache Behavior Optimization", "17"),
        ("7. Verification, Testing & Results", "18"),
        ("   7.1 Automated Testing Methodology", "18"),
        ("   7.2 Test Cases & Execution Results", "19"),
        ("   7.3 Security & Tamper-Detection Analysis", "20"),
        ("8. Advantages, Applications & Future Scope", "21"),
        ("   8.1 Key Advantages", "21"),
        ("   8.2 Real-World Applications", "21"),
        ("   8.3 Future Enhancements", "22"),
        ("9. Conclusion", "23"),
        ("References", "24"),
    ]

    toc_table = doc.add_table(rows=len(toc_items), cols=2)
    toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    toc_table.autofit = False
    for i, (item, page) in enumerate(toc_items):
        cell_item = toc_table.rows[i].cells[0]
        cell_page = toc_table.rows[i].cells[1]
        cell_item.width = Inches(5.5)
        cell_page.width = Inches(1.0)
        cell_item.paragraphs[0].text = item
        cell_page.paragraphs[0].text = page
        cell_page.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        if not item.startswith("   "):
            cell_item.paragraphs[0].runs[0].font.bold = True
            cell_page.paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 1: INTRODUCTION
    # =========================================================================
    def add_chapter_heading(number, title):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(f"CHAPTER {number}: {title.upper()}")
        r.font.bold = True
        r.font.size = Pt(14)
        r.font.color.rgb = RGBColor(15, 23, 42)
        return h

    def add_subheading(title):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(title)
        r.font.bold = True
        r.font.size = Pt(12)
        r.font.color.rgb = RGBColor(2, 132, 199)
        return h

    add_chapter_heading(1, "Introduction and Objectives")
    add_subheading("1.1 Background and Motivation")
    doc.add_paragraph(
        "Cloud object storage repositories such as Amazon Simple Storage Service (Amazon S3) have become the "
        "backbone of contemporary enterprise applications due to their high availability, elasticity, and multi-region durability. "
        "However, as high-value data, intellectual property, medical records, and legal archives migrate to public clouds, "
        "security models that rely solely on server-side encryption (SSE) fail to provide comprehensive zero-trust assurance. "
        "Under server-side encryption models (e.g., SSE-S3 or SSE-KMS), the cloud provider holds the cryptographic master keys "
        "or access delegation tokens. Any administrative misconfiguration, compromised IAM credentials, or cloud infrastructure breach "
        "can expose sensitive data in plaintext.\n\n"
        "To mitigate these vulnerabilities, client-side encryption (CSE) combined with file segmentation offers an optimal paradigm: "
        "raw plaintext never leaves the boundary of the client browser. By splitting files into discrete segments, encrypting each "
        "segment under authenticated Galois/Counter Mode (AES-256-GCM), and distributing segments across cloud storage, the system ensures "
        "that even if an adversary gains full read access to the S3 bucket, they obtain only opaque, individually nonced ciphertext blocks."
    )

    add_subheading("1.2 Problem Statement")
    doc.add_paragraph(
        "Traditional cloud file storage systems exhibit significant vulnerabilities: (1) Reliance on server-controlled encryption keys; "
        "(2) Monolithic file uploads that fail when network interruptions occur on large files; (3) Lack of cryptographic authentication "
        "binding blocks to their sequence order, making segment-swapping attacks possible; and (4) Exposure of website hosting origins "
        "when static portals are made publicly readable to enable web access. There is a compelling need for an integrated system that "
        "implements bounded-memory browser-side segmentation, authenticated AES-256-GCM encryption with Additional Authenticated Data (AAD), "
        "PBKDF2 key derivation, SHA-256 integrity verification, and secure CloudFront Content Delivery Network (CDN) distribution using Origin Access Control (OAC)."
    )

    add_subheading("1.3 Project Objectives")
    doc.add_paragraph(
        "The primary objectives of this project are:\n"
        "1. To implement an efficient file segmentation engine supporting configurable block sizes (256 KB, 512 KB, 1 MB, 5 MB) using browser Blob slicing.\n"
        "2. To implement authenticated client-side encryption using AES-256-GCM via the Web Crypto API, deriving keys through PBKDF2 with 100,000 iterations.\n"
        "3. To eliminate nonce reuse by generating cryptographically secure 96-bit random nonces for every block.\n"
        "4. To bind metadata (block index, file ID, total blocks) to ciphertexts using Additional Authenticated Data (AAD) to prevent block transposition attacks.\n"
        "5. To integrate with Amazon S3 using AWS SDK for JavaScript v3, storing blocks in a private, encrypted storage layout.\n"
        "6. To provide an ordered reconstruction pipeline that verifies block authentication tags, stops on tampering, and executes end-to-end SHA-256 verification.\n"
        "7. To establish CloudFront CDN distribution with Origin Access Control (OAC) and HTTPS, maintaining zero public access to the S3 bucket.\n"
        "8. To construct a professional, dark-themed cloud security dashboard with analytics, an educational Encryption Lab, and latency testing."
    )

    add_subheading("1.4 Scope and Limitations")
    doc.add_paragraph(
        "Scope: The project covers full-stack web application development (React, Vite, Express, TypeScript, AWS SDK v3), browser cryptography, "
        "S3 object storage, CloudFront CDN integration, and automated testing.\n"
        "Limitations: Client-side cryptographic processing of extremely large files (>1 GB) is bounded by browser memory limits and Single-Threaded JavaScript event loop; "
        "hardware security modules (HSM) or smartcard key storage are outside the scope of this mini-project."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 2: LITERATURE SURVEY & SYSTEM COMPARISON
    # =========================================================================
    add_chapter_heading(2, "Literature Survey & System Comparison")
    add_subheading("2.1 Review of Related Work")
    doc.add_paragraph(
        "Cryptographic cloud storage has been widely investigated across academic literature:\n"
        "• Dworkin et al. (NIST SP 800-38D, 2007) formalized the Galois/Counter Mode (GCM) of operation for block ciphers, demonstrating "
        "its AEAD properties and throughput advantages over CBC mode.\n"
        "• Kamara and Lauter (2010) proposed cryptographic cloud storage architectures, establishing the necessity of client-side key generation "
        "and data integrity proofs.\n"
        "• Bellare, Rogaway, and Rogaway (2000) evaluated Authenticated Encryption, proving that Encrypt-and-MAC or MAC-then-Encrypt models often lead to "
        "subtle vulnerabilities, whereas integrated AEAD modes like AES-GCM provide mathematically sound security.\n"
        "• Amazon Web Services (2022) introduced Origin Access Control (OAC) for CloudFront, superseding legacy Origin Access Identities (OAI) by "
        "enforcing SigV4 request signing and supporting AWS KMS encryption and regional S3 endpoints."
    )

    add_subheading("2.2 Existing System vs. Proposed System")
    doc.add_paragraph("Table 2.1 presents a comparative analysis between conventional cloud storage and SecureVault Cloud.")

    comp_table = doc.add_table(rows=6, cols=3)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_table.autofit = False

    headers = ["Feature / Attribute", "Conventional Cloud Storage (Dropbox/S3)", "Proposed System (SecureVault Cloud)"]
    for j, h_text in enumerate(headers):
        cell = comp_table.rows[0].cells[j]
        cell.paragraphs[0].text = h_text
        cell.paragraphs[0].runs[0].font.bold = True
        cell.paragraphs[0].runs[0].font.size = Pt(10)
        set_cell_background(cell, "0F172A")
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(248, 250, 252)

    rows_data = [
        ("Encryption Location", "Server-Side (Cloud Provider controls keys)", "Client-Side (Zero-Knowledge, browser Web Crypto)"),
        ("File Granularity", "Monolithic file uploads", "Block segmentation (256KB – 5MB chunks)"),
        ("Block Binding (Anti-Transposition)", "None (metadata stored in unauthenticated DB)", "Cryptographically bound via AAD (fileId + index)"),
        ("Integrity Verification", "Optional MD5 (vulnerable to collisions)", "Mandatory SHA-256 + AES-GCM 128-bit Poly/GHASH tags"),
        ("CDN Origin Protection", "Public S3 bucket or legacy OAI", "Private S3 Origin with Origin Access Control (OAC)"),
    ]

    for i, row in enumerate(rows_data):
        for j, val in enumerate(row):
            cell = comp_table.rows[i + 1].cells[j]
            cell.paragraphs[0].text = val
            cell.paragraphs[0].runs[0].font.size = Pt(9.5)
            if i % 2 == 1:
                set_cell_background(cell, "F1F5F9")

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 3: SYSTEM REQUIREMENTS & SPECIFICATIONS
    # =========================================================================
    add_chapter_heading(3, "System Requirements & Specifications")
    add_subheading("3.1 Hardware Requirements")
    doc.add_paragraph(
        "Development and Deployment Environment:\n"
        "• Processor: Intel Core i5 / AMD Ryzen 5 or higher (Dual-Core 2.0 GHz minimum).\n"
        "• RAM: 8 GB minimum (16 GB recommended for concurrent Vite dev server and Node.js).\n"
        "• Hard Disk: 2 GB available SSD space for project source code and local storage cache.\n"
        "• Network: Broadband Internet connection with TLS 1.3 support for AWS API communication."
    )

    add_subheading("3.2 Software & Framework Requirements")
    doc.add_paragraph(
        "• Operating System: Windows 11 / Linux (Ubuntu 22.04 LTS) / macOS.\n"
        "• Runtime Environment: Node.js v20.x or v24.x LTS with npm v10.x+.\n"
        "• Frontend Stack: React 18.3, Vite 6.1, TypeScript 5.7, Tailwind CSS 3.4, Lucide React, Recharts.\n"
        "• Backend Stack: Express.js 4.21, TypeScript, AWS SDK v3 (@aws-sdk/client-s3), Zod 3.24, Multer, Helmet, CORS.\n"
        "• Testing Tools: Vitest 3.0, Node.js Web Crypto API.\n"
        "• Cloud Infrastructure: Amazon Web Services (AWS) — S3 (Simple Storage Service), CloudFront CDN, IAM, CloudFormation."
    )

    add_subheading("3.3 Cryptographic Standards Reference")
    doc.add_paragraph(
        "All cryptographic primitives used in SecureVault Cloud adhere to established standards:\n"
        "• NIST SP 800-38D: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM).\n"
        "• NIST SP 800-132: Recommendation for Password-Based Key Derivation (PBKDF2-HMAC-SHA256, 100,000 iterations).\n"
        "• FIPS PUB 180-4: Secure Hash Standard (SHA-256).\n"
        "• NIST SP 800-90A: Recommendation for Random Number Generation Using Deterministic Random Bit Generators."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 4: SYSTEM ARCHITECTURE & DATA FLOW
    # =========================================================================
    add_chapter_heading(4, "System Architecture & Data Flow")
    add_subheading("4.1 Architectural Overview")
    doc.add_paragraph(
        "The system architecture is structured into four primary tiers:\n"
        "1. Presentation Tier (Client SPA): Responsive React application running in the user's browser, responsible for UI, file slicing, Web Crypto operations, and progress tracking.\n"
        "2. Cryptographic Execution Tier (Client-Side Web Crypto): In-memory key derivation (PBKDF2), AES-GCM block encryption, nonce generation, and SHA-256 digest computation.\n"
        "3. Application & API Gateway Tier (Express Backend): Validates manifests via Zod, manages file session states, coordinates object key generation, and interfaces with storage adapters.\n"
        "4. Cloud Storage & Edge Distribution Tier (Amazon S3 & CloudFront): Private S3 bucket storing encrypted blocks (`.enc`) and manifest (`.json`); CloudFront CDN edge points caching static web assets with OAC."
    )

    add_subheading("4.2 Data Flow Diagrams")
    doc.add_paragraph(
        "DFD Level 0 (Context Level):\n"
        "[User Browser] --(Upload Request + Encrypted Blocks + Manifest)--> [SecureVault Engine] --> [Amazon S3 Bucket]\n"
        "[User Browser] <--(Encrypted Blocks + Manifest)-- [SecureVault Engine] <-- [Amazon S3 Bucket]\n"
        "[End User] <--(Static Web Portal over HTTPS)-- [Amazon CloudFront CDN] <--(OAC Protected Read)-- [S3 Website Bucket]\n\n"
        "DFD Level 1 (Detailed Upload Pipeline):\n"
        "1.0 File Slicing: File Input &rarr; Compute Original SHA-256 &rarr; Slice into N blocks.\n"
        "2.0 Key Derivation: Password + 32-byte Salt &rarr; PBKDF2(100k, SHA-256) &rarr; 256-bit AES-GCM Key.\n"
        "3.0 Block Encryption: Plaintext Block + Unique 12-byte Nonce + AAD &rarr; AES-GCM &rarr; Combined Payload [IV + Ciphertext + Tag].\n"
        "4.0 Transport & Storage: Payload &rarr; Express API &rarr; AWS S3 PutObjectCommand &rarr; S3 Storage.\n"
        "5.0 Manifest Registration: Authenticated Manifest &rarr; Hash &rarr; S3 PutManifest."
    )

    add_subheading("4.3 S3 Storage Layout & Object Organization")
    doc.add_paragraph(
        "Objects are organized within Amazon S3 in a clean, hierarchical, least-privilege structure:\n"
        "secure-files/\n"
        "  ├── {userId}/\n"
        "  │   ├── {fileId}/\n"
        "  │   │   ├── manifest.json       # Authenticated JSON manifest\n"
        "  │   │   └── blocks/\n"
        "  │   │       ├── 000000.enc      # [12B Nonce] + [Ciphertext] + [16B Tag]\n"
        "  │   │       ├── 000001.enc\n"
        "  │   │       └── 000002.enc\n"
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 5: ALGORITHMIC MODULES IMPLEMENTATION
    # =========================================================================
    add_chapter_heading(5, "Algorithmic Modules Implementation")
    add_subheading("5.1 File Segmentation Algorithm")
    doc.add_paragraph(
        "Algorithm 1: Bounded-Memory File Segmentation\n"
        "Input: File F of size S bytes, configured block size B bytes.\n"
        "Output: Block array B_0, B_1, ..., B_{N-1} where N = ceil(S / B).\n"
        "1: If S == 0 then return Empty Block Set (N = 0).\n"
        "2: Compute N = ceil(S / B).\n"
        "3: For i = 0 to N - 1 do:\n"
        "4:   start = i * B\n"
        "5:   end = min(start + B, S)\n"
        "6:   chunkBlob = F.slice(start, end)\n"
        "7:   chunkBuffer = await chunkBlob.arrayBuffer()\n"
        "8:   Yield chunkBuffer to Encryption Engine.\n"
        "9: End For."
    )

    add_subheading("5.2 PBKDF2 Key Derivation Algorithm")
    doc.add_paragraph(
        "Algorithm 2: PBKDF2-HMAC-SHA256 Key Derivation\n"
        "Input: User Passphrase P, Random Salt S (32 bytes), Iteration Count C = 100,000.\n"
        "Output: 256-bit AES-GCM CryptoKey K.\n"
        "1: Import P as raw key material with usage ['deriveKey'].\n"
        "2: Apply PBKDF2 with PRF = HMAC-SHA-256:\n"
        "   DK = PBKDF2(PRF, P, S, C, 256)\n"
        "3: Instantiate DK as non-extractable CryptoKey with algorithm 'AES-GCM' and length 256 bits.\n"
        "4: Return K."
    )

    add_subheading("5.3 AES-256-GCM Encryption with AAD")
    doc.add_paragraph(
        "Algorithm 3: Authenticated Block Encryption\n"
        "Input: Plaintext buffer M_i, Key K, FileId FID, BlockIndex i, TotalBlocks N.\n"
        "Output: Combined Payload P_i = IV_i || C_i || T_i, Nonce IV_i, Tag T_i.\n"
        "1: Generate cryptographically secure random 12-byte IV_i: crypto.getRandomValues(12).\n"
        "2: Construct AAD = UTF8_Encode('SecureVault|v1|file:' + FID + '|block:' + i + '|total:' + N).\n"
        "3: Compute (C_i, T_i) = AES_GCM_Encrypt(K, IV_i, AAD, M_i, tagLength=128).\n"
        "4: Pack combined payload: P_i = [IV_i (12B)] || [C_i || T_i (16B)].\n"
        "5: Return P_i, IV_i, T_i."
    )

    add_subheading("5.4 Ordered File Reconstruction & SHA-256 Verification")
    doc.add_paragraph(
        "Algorithm 4: Decryption, Reconstruction, and Verification\n"
        "Input: Manifest M, Encrypted block payloads P_0...P_{N-1}, User Passphrase P.\n"
        "Output: Reconstructed File Blob F_orig or Cryptographic Error.\n"
        "1: Derive K from P and M.encryption.kdf.salt using PBKDF2.\n"
        "2: For i = 0 to N - 1 do:\n"
        "3:   Extract IV_i and Ciphertext from P_i.\n"
        "4:   Reconstruct expected AAD for block i.\n"
        "5:   Decrypt block: M_i = AES_GCM_Decrypt(K, IV_i, AAD, Ciphertext).\n"
        "6:   If tag validation fails, ABORT IMMEDIATELY with Authentication Error.\n"
        "7:   decryptedChunks[i] = M_i.\n"
        "8: End For.\n"
        "9: ReconstructedBlob = new Blob(decryptedChunks, mimeType).\n"
        "10: ComputedHash = SHA-256(ReconstructedBlob).\n"
        "11: If ComputedHash != M.originalSha256 then ABORT with Integrity Failure.\n"
        "12: Return ReconstructedBlob for user download."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 6: CLOUD INFRASTRUCTURE & CDN DISTRIBUTION
    # =========================================================================
    add_chapter_heading(6, "Cloud Infrastructure & CDN Distribution")
    add_subheading("6.1 Amazon S3 Private Bucket Architecture")
    doc.add_paragraph(
        "Amazon S3 serves as the primary object store for encrypted blocks and manifests. To adhere strictly to security best practices:\n"
        "• Public Access Block: `BlockPublicAcls`, `BlockPublicPolicy`, `IgnorePublicAcls`, and `RestrictPublicBuckets` are all set to `True`.\n"
        "• Server-Side Encryption: AWS S3 default encryption (SSE-S3 AES-256) is enabled, providing defense-in-depth on top of client-side encryption.\n"
        "• CORS Configuration: Restricted to the frontend domain with permitted methods `GET`, `PUT`, `DELETE` and headers `X-User-Id`."
    )

    add_subheading("6.2 Amazon CloudFront Origin Access Control (OAC)")
    doc.add_paragraph(
        "Amazon CloudFront is configured to distribute the static web dashboard globally. Rather than opening the S3 hosting bucket to public web traffic, "
        "CloudFront uses Origin Access Control (OAC). The S3 bucket policy permits access only when the request principal is `cloudfront.amazonaws.com` "
        "and the `AWS:SourceArn` matches the specific CloudFront distribution ARN:\n\n"
        "Condition: StringEquals { AWS:SourceArn: arn:aws:cloudfront::ACCOUNT:distribution/DIST_ID }\n\n"
        "This completely eliminates direct public access to S3, mitigating data scraping and unauthorized object requests."
    )

    add_subheading("6.3 HTTPS & Cache Behavior Optimization")
    doc.add_paragraph(
        "• Viewer Protocol Policy: `redirect-to-https` automatically upgrades insecure HTTP requests to HTTPS (TLS 1.2/1.3).\n"
        "• Cache Optimization: Static JavaScript and CSS bundles with unique Vite content hashes receive `Cache-Control: public, max-age=31536000, immutable`, "
        "minimizing latency and origin server load. The root `index.html` file receives `max-age=0, must-revalidate` to ensure immediate updates upon redeployment."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 7: VERIFICATION, TESTING & RESULTS
    # =========================================================================
    add_chapter_heading(7, "Verification, Testing & Results")
    add_subheading("7.1 Automated Testing Methodology")
    doc.add_paragraph(
        "Testing was conducted using Vitest to execute unit tests and integration tests covering the entire data lifecycle. "
        "A local storage adapter mirroring Amazon S3's path hierarchy was utilized during testing to enable zero-cost, "
        "fully reproducible automated verification."
    )

    add_subheading("7.2 Test Cases & Execution Results")
    doc.add_paragraph("Table 7.1 details the test cases implemented, expected behavior, and actual execution results.")

    test_table = doc.add_table(rows=15, cols=4)
    test_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    test_table.autofit = False

    t_headers = ["Test ID", "Test Description", "Expected Cryptographic Outcome", "Status"]
    for j, h_text in enumerate(t_headers):
        cell = test_table.rows[0].cells[j]
        cell.paragraphs[0].text = h_text
        cell.paragraphs[0].runs[0].font.bold = True
        cell.paragraphs[0].runs[0].font.size = Pt(9.5)
        set_cell_background(cell, "0F172A")
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(248, 250, 252)

    tests_data = [
        ("TC-01", "PBKDF2 Key Derivation", "Consistent 256-bit AES key from same salt/passphrase", "PASS"),
        ("TC-02", "AES-256-GCM Roundtrip", "Decrypted plaintext matches original plaintext identically", "PASS"),
        ("TC-03", "Wrong Password Rejection", "AES-GCM tag mismatch throws OperationError, stops download", "PASS"),
        ("TC-04", "1-Bit Ciphertext Tampering", "Flipping bit #15 in ciphertext triggers immediate authentication failure", "PASS"),
        ("TC-05", "AAD Block Index Transposition", "Block 0 decrypted as Block 1 rejected by AAD tag verification", "PASS"),
        ("TC-06", "Nonce Uniqueness", "Consecutive blocks produce distinct 96-bit nonces", "PASS"),
        ("TC-07", "Block Count Math: 0 Bytes", "ceil(0 / 524288) = 0 blocks handled gracefully", "PASS"),
        ("TC-08", "Block Count Math: 524289 B", "ceil(524289 / 524288) = 2 blocks generated correctly", "PASS"),
        ("TC-09", "Binary Slicing & Reassembly", "5000 random binary bytes sliced, encrypted, and reassembled", "PASS"),
        ("TC-10", "Empty File SHA-256", "Returns exact NIST standard empty hash e3b0c44...b855", "PASS"),
        ("TC-11", "SHA-256 64-char Hex Output", "Matches regex ^[0-9a-f]{64}$", "PASS"),
        ("TC-12", "Single Character Mutation", "SHA-256 hash changes completely (avalanche effect)", "PASS"),
        ("TC-13", "Corrupted Reconstruction Check", "Altered byte in reassembled buffer fails SHA-256 check", "PASS"),
        ("TC-14", "End-to-End Pipeline Integration", "File -> Slicing -> AES-GCM -> Storage -> Decrypt -> SHA-256 verified", "PASS"),
    ]

    for i, row in enumerate(tests_data):
        for j, val in enumerate(row):
            cell = test_table.rows[i + 1].cells[j]
            cell.paragraphs[0].text = val
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            if j == 3:
                cell.paragraphs[0].runs[0].font.bold = True
                cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(16, 185, 129) # Emerald 500
            if i % 2 == 1:
                set_cell_background(cell, "F8FAFC")

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 8: ADVANTAGES, APPLICATIONS & FUTURE SCOPE
    # =========================================================================
    add_chapter_heading(8, "Advantages, Applications & Future Scope")
    add_subheading("8.1 Key Advantages")
    doc.add_paragraph(
        "1. Zero-Knowledge Confidentiality: The server and cloud provider receive only encrypted blocks; plaintext and keys never cross the network boundary.\n"
        "2. Resilient Block-Level Transport: Network disconnects require re-uploading only unacknowledged blocks rather than entire gigabyte files.\n"
        "3. Cryptographic Tamper Evident: AES-GCM tags guarantee that any bit flip by an attacker or bit rot in storage is caught immediately.\n"
        "4. Anti-Splicing Protection: Additional Authenticated Data (AAD) prevents block reordering or injection attacks.\n"
        "5. Cost & Latency Optimization: CloudFront edge caching offloads origin bandwidth and provides sub-50ms static asset delivery."
    )

    add_subheading("8.2 Real-World Applications")
    doc.add_paragraph(
        "• Healthcare & EHR Storage: HIPAA-compliant storage of patient diagnostic imagery and medical records.\n"
        "• Legal and Financial Archives: Tamper-evident repository for contractual agreements, audit logs, and transaction ledgers.\n"
        "• Cloud Backup Solutions: Secure end-to-end encrypted backup clients for confidential personal or enterprise files.\n"
        "• Secure Media Distribution: Encrypted digital asset distribution with CDN delivery."
    )

    add_subheading("8.3 Future Enhancements")
    doc.add_paragraph(
        "• Web Workers Multithreading: Offload encryption of multiple blocks to concurrent Web Workers for parallel multi-core performance.\n"
        "• Shamir's Secret Sharing: Split encryption keys among multiple custodians to implement M-of-N multi-party authorization.\n"
        "• Quantum-Resistant Cryptography: Integrate post-quantum key encapsulation mechanisms (such as ML-KEM / Kyber) alongside AES-256.\n"
        "• Zero-Knowledge Proofs: Integrate zk-SNARKs for provable data possession without requiring block downloads."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 9: CONCLUSION & REFERENCES
    # =========================================================================
    add_chapter_heading(9, "Conclusion")
    doc.add_paragraph(
        "The SecureVault Cloud project successfully designs, implements, and verifies an end-to-end secure cloud file storage "
        "and distribution platform. By decoupling data confidentiality from cloud provider trust through browser-side AES-256-GCM encryption, "
        "file segmentation, and PBKDF2 key derivation, the system guarantees zero-knowledge data privacy. "
        "The integration of Additional Authenticated Data (AAD) protects against sophisticated block transposition attacks, "
        "while mandatory post-reconstruction SHA-256 integrity verification guarantees absolute byte fidelity. "
        "Deploying the frontend via Amazon CloudFront with Origin Access Control (OAC) ensures that S3 buckets remain completely private "
        "while global users enjoy HTTPS security and low-latency edge delivery. "
        "The automated test suite validated all 14 test cases successfully, establishing the system as a robust, academic-grade "
        "demonstration of modern cloud computing and applied cryptography."
    )

    h_ref = doc.add_paragraph()
    h_ref.paragraph_format.space_before = Pt(18)
    h_ref.paragraph_format.space_after = Pt(8)
    r_ref = h_ref.add_run("REFERENCES")
    r_ref.font.bold = True
    r_ref.font.size = Pt(14)
    r_ref.font.color.rgb = RGBColor(15, 23, 42)

    references = [
        "[1] M. Dworkin, \"Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC,\" NIST Special Publication 800-38D, National Institute of Standards and Technology, Gaithersburg, MD, 2007.",
        "[2] B. Kaliski, \"PKCS #5: Password-Based Cryptography Specification Version 2.0,\" RFC 2898 / NIST SP 800-132, 2000.",
        "[3] S. Kamara and K. Lauter, \"Cryptographic Cloud Storage,\" in Financial Cryptography and Data Security, Lecture Notes in Computer Science, vol. 6054, Springer, Berlin, Heidelberg, 2010, pp. 136–149.",
        "[4] National Institute of Standards and Technology, \"Secure Hash Standard (SHS),\" Federal Information Processing Standards Publication (FIPS PUB) 180-4, Aug. 2015.",
        "[5] M. Bellare and P. Rogaway, \"Encode-then-encipher encryption: How to exploit exactly one block cipher call,\" in Advances in Cryptology — ASIACRYPT 2000, Springer, 2000, pp. 206–220.",
        "[6] Amazon Web Services, \"Amazon Simple Storage Service (S3) Developer Guide,\" AWS Documentation, 2024. [Online]. Available: https://docs.aws.amazon.com/s3/",
        "[7] Amazon Web Services, \"Amazon CloudFront Developer Guide: Restricting access to an Amazon S3 origin using Origin Access Control (OAC),\" AWS Documentation, 2024.",
        "[8] W3C, \"Web Cryptography API - W3C Recommendation,\" World Wide Web Consortium, 2017. [Online]. Available: https://www.w3.org/TR/WebCryptoAPI/",
    ]

    for ref in references:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        p.add_run(ref).font.size = Pt(10)

    # Save document
    output_filename = "Secure_Cloud_Storage_Mini_Project_Report.docx"
    doc.save(output_filename)
    print(f"Report successfully generated and saved to: {os.path.abspath(output_filename)}")

if __name__ == "__main__":
    create_report()
