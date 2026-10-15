import React, { useState, useEffect } from 'react';
import {
  DownloadCloud,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Boxes,
  Zap,
} from 'lucide-react';
import { FileRecord, FileManifest, DownloadProgressState } from '../types';
import { ApiService } from '../services/api.service';
import { decryptAndReconstructFile, ReconstructionResult } from '../services/segmentation.service';
import { formatBytes } from '../utils/formatters';
import { VaultLockDial } from '../components/VaultLockDial';
import { BlockVisualizer, VisualBlockItem } from '../components/BlockVisualizer';

interface DownloadsPageProps {
  initialFileId?: string;
  onShowToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ initialFileId, onShowToast }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>(initialFileId || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Simulation mode toggles for demonstration
  const [simulateTampering, setSimulateTampering] = useState<boolean>(false);

  const [progress, setProgress] = useState<DownloadProgressState>({
    stage: 'idle',
    currentBlock: 0,
    totalBlocks: 0,
    percentage: 0,
    message: 'Ready to download and decrypt',
  });

  const [reconstructionResult, setReconstructionResult] = useState<ReconstructionResult | null>(null);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');

  useEffect(() => {
    loadFileList();
  }, []);

  useEffect(() => {
    if (initialFileId) {
      setSelectedFileId(initialFileId);
    }
  }, [initialFileId]);

  const loadFileList = async () => {
    try {
      const data = await ApiService.listFiles();
      setFiles(data);
      if (!selectedFileId && data.length > 0) {
        setSelectedFileId(data[0].fileId);
      }
    } catch (err) {
      console.error('Failed to load file list:', err);
    }
  };

  const selectedFileRecord = files.find((f) => f.fileId === selectedFileId);

  const handleStartPipeline = async () => {
    if (!selectedFileId) {
      onShowToast('error', 'Selection Required', 'Please select a file to download.');
      return;
    }

    if (!password) {
      onShowToast('error', 'Password Required', 'Please enter your decryption password.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsDownloading(true);
    setReconstructionResult(null);
    if (downloadBlobUrl) {
      URL.revokeObjectURL(downloadBlobUrl);
      setDownloadBlobUrl(null);
    }

    try {
      // Step 1: Fetch Manifest
      setProgress({
        stage: 'fetching_manifest',
        currentBlock: 0,
        totalBlocks: selectedFileRecord?.totalBlocks || 0,
        percentage: 15,
        message: 'Retrieving authenticated file manifest from object storage...',
      });

      const manifest = await ApiService.getManifest(selectedFileId);
      setDownloadFileName(manifest.fileName);

      // Step 2: Download Encrypted Blocks
      const totalBlocks = manifest.totalBlocks;
      const blockPayloads = new Map<number, ArrayBuffer>();

      setProgress({
        stage: 'downloading_blocks',
        currentBlock: 0,
        totalBlocks,
        percentage: 25,
        message: `Downloading ${totalBlocks} encrypted blocks from cloud storage...`,
      });

      for (let i = 0; i < totalBlocks; i++) {
        if (controller.signal.aborted) throw new Error('Download aborted by user');

        const blockBuffer = await ApiService.downloadBlock(
          manifest.fileId,
          i,
          'user-default',
          controller.signal
        );

        // If user enabled simulation: corrupt block #0 by flipping byte #15
        if (simulateTampering && i === 0) {
          const corruptedView = new Uint8Array(blockBuffer);
          corruptedView[15] ^= 0xff; // Flips 1 byte of the ciphertext
        }

        blockPayloads.set(i, blockBuffer);

        const dlPercent = 25 + Math.round(((i + 1) / (totalBlocks || 1)) * 30);
        setProgress({
          stage: 'downloading_blocks',
          currentBlock: i + 1,
          totalBlocks,
          percentage: dlPercent,
          message: `Downloaded block ${i + 1} of ${totalBlocks}`,
        });
      }

      // Step 3 & 4: Derive Key & Decrypt Each Block
      setProgress({
        stage: 'deriving_key',
        currentBlock: 0,
        totalBlocks,
        percentage: 60,
        message: 'Deriving AES-256-GCM key from PBKDF2 salt...',
      });

      const result = await decryptAndReconstructFile(
        manifest,
        blockPayloads,
        password,
        (currBlock, totalBlk, stageName) => {
          const decPercent = 65 + Math.round((currBlock / (totalBlk || 1)) * 25);
          setProgress({
            stage: 'decrypting',
            currentBlock: currBlock,
            totalBlocks: totalBlk,
            percentage: decPercent,
            message: stageName,
          });
        },
        controller.signal
      );

      // Step 5: Verification Completed
      setProgress({
        stage: 'completed',
        currentBlock: totalBlocks,
        totalBlocks,
        percentage: 100,
        message: 'All blocks authenticated, reconstructed, and SHA-256 verified successfully!',
      });

      setReconstructionResult(result);
      const url = URL.createObjectURL(result.reconstructedBlob);
      setDownloadBlobUrl(url);

      onShowToast(
        'success',
        'Decryption & Integrity Verified',
        `Original file "${manifest.fileName}" reconstructed without errors.`
      );
    } catch (err: any) {
      if (!controller.signal.aborted) {
        console.error('Download / Decryption error:', err);
        setProgress((prev) => ({
          ...prev,
          stage: 'error',
          error: err.message || 'Decryption failed',
          message: err.message || 'Decryption failed',
        }));
        onShowToast('error', 'Decryption Failed', err.message);
      }
    } finally {
      setIsDownloading(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setIsDownloading(false);
      setProgress((prev) => ({
        ...prev,
        stage: 'idle',
        message: 'Download cancelled',
      }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-vault-100 tracking-tight">
          Secure Download, Decryption & Integrity Verification
        </h2>
        <p className="text-sm text-vault-500 mt-1">
          Fetch encrypted segments from Amazon S3, authenticate with AES-256-GCM, reconstruct the file, and verify
          cryptographic SHA-256 integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-5">
            {/* File Selector */}
            <div>
              <label className="text-sm font-semibold text-vault-100 block mb-2">Select Encrypted File</label>
              <select
                value={selectedFileId}
                onChange={(e) => {
                  setSelectedFileId(e.target.value);
                  setReconstructionResult(null);
                }}
                disabled={isDownloading}
                className="w-full px-4 py-3 rounded-xl bg-vault-850 border border-vault-700 text-vault-100 focus:outline-none focus:border-vault-accent focus:ring-1 focus:ring-vault-accent text-sm font-sans"
              >
                {files.map((file) => (
                  <option key={file.fileId} value={file.fileId}>
                    {file.fileName} &bull; {formatBytes(file.originalSize)} ({file.totalBlocks} blocks)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected File Details */}
            {selectedFileRecord && (
              <div className="p-4 rounded-xl bg-vault-850/70 border border-vault-800 text-xs font-mono space-y-1.5 text-vault-400">
                <div className="flex justify-between">
                  <span className="text-vault-500">File ID:</span>
                  <span className="text-vault-400">{selectedFileRecord.fileId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vault-500">Total Blocks:</span>
                  <span className="text-vault-400">{selectedFileRecord.totalBlocks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vault-500">Storage Backend:</span>
                  <span>{selectedFileRecord.storageProvider === 's3' ? 'AWS S3 (Private)' : 'Local Adapter'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vault-500">Trusted SHA-256:</span>
                  <span className="text-emerald-400 truncate max-w-[200px]" title={selectedFileRecord.originalSha256}>
                    {selectedFileRecord.originalSha256}
                  </span>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="text-sm font-semibold text-vault-100 block mb-2">Decryption Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isDownloading}
                  placeholder="Enter the password used during upload..."
                  className="w-full px-4 py-3 rounded-xl bg-vault-850 border border-vault-700 text-vault-100 placeholder-vault-600 focus:outline-none focus:border-vault-accent focus:ring-1 focus:ring-vault-accent pr-12 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-vault-500 hover:text-vault-100"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Educational Simulation Options for College Demonstration */}
            <div className="pt-2 border-t border-vault-800 space-y-2">
              <span className="text-xs font-semibold uppercase text-vault-500 tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Demonstration / Tampering Test
              </span>
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-vault-850/60 border border-vault-800/80 hover:border-amber-500/40 transition">
                <input
                  type="checkbox"
                  checked={simulateTampering}
                  onChange={(e) => setSimulateTampering(e.target.checked)}
                  disabled={isDownloading}
                  className="w-4 h-4 text-amber-500 rounded bg-vault-900 border-vault-700 focus:ring-0"
                />
                <span className="text-xs text-vault-400">
                  <span className="font-semibold text-amber-400">Simulate Ciphertext Tampering:</span> Artificially
                  corrupts 1 bit in block #0 to test if AES-GCM tag verification catches it immediately.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {!isDownloading ? (
                <button
                  onClick={handleStartPipeline}
                  disabled={!selectedFileId || !password}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                    selectedFileId && password
                      ? 'bg-vault-accent hover:bg-vault-copper text-vault-950 shadow-lg shadow-vault-accent/20'
                      : 'bg-vault-800 text-vault-600 cursor-not-allowed'
                  }`}
                >
                  <DownloadCloud className="w-4 h-4" /> Authenticate, Decrypt & Reconstruct
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="w-full py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-semibold text-sm transition"
                >
                  Cancel Operation
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Vault Dial & Progress */}
        <div className="space-y-6">
          {/* Cyber Cryptographic Vault Dial */}
          <VaultLockDial
            progress={progress}
            isUnlocked={!!reconstructionResult}
            hasError={progress.stage === 'error'}
          />

          {/* Progress Card */}
          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
            <h3 className="text-base font-semibold text-vault-100">Pipeline Execution</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-vault-400">{progress.message}</span>
                <span className="text-vault-400 font-bold">{progress.percentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-vault-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            {/* Interactive Block Matrix during Decryption */}
            {selectedFileRecord && selectedFileRecord.totalBlocks > 0 && (
              <div className="pt-2">
                <BlockVisualizer
                  totalBlocks={selectedFileRecord.totalBlocks}
                  currentProcessingIndex={progress.currentBlock > 0 ? progress.currentBlock - 1 : -1}
                  blockSizeBytes={selectedFileRecord.blockSize}
                  fileId={selectedFileRecord.fileId}
                />
              </div>
            )}

            {/* Security Error Callout */}
            {progress.stage === 'error' && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-rose-400">
                  <XCircle className="w-4 h-4" /> Decryption / Authentication Rejected
                </div>
                <p className="leading-relaxed font-mono">{progress.error}</p>
                <p className="text-[11px] text-vault-500 pt-1">
                  Security Guarantee: No corrupted or unauthenticated binary bytes will ever be output to the user.
                </p>
              </div>
            )}

            {/* Verified Download Deliverable Card */}
            {reconstructionResult && downloadBlobUrl && (
              <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                  <CheckCircle2 className="w-5 h-5" /> SHA-256 Verified Match!
                </div>

                <div className="text-xs font-mono space-y-1.5 text-vault-400">
                  <div>
                    <span className="text-vault-500">File:</span> {downloadFileName}
                  </div>
                  <div>
                    <span className="text-vault-500">Reconstructed Size:</span>{' '}
                    {formatBytes(reconstructionResult.fileSize)}
                  </div>
                  <div className="break-all pt-1">
                    <span className="text-vault-500">Computed SHA-256:</span>
                    <br />
                    <span className="text-emerald-300">{reconstructionResult.reconstructedSha256}</span>
                  </div>
                </div>

                <a
                  href={downloadBlobUrl}
                  download={downloadFileName}
                  className="w-full mt-3 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-vault-950 font-bold text-sm text-center block transition shadow-lg shadow-emerald-500/20"
                >
                  Save Reconstructed File to Disk
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
