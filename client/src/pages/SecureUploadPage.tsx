import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Boxes,
  ArrowRight,
  Shield,
  File,
  Sparkles,
} from 'lucide-react';
import { BlockSizeOption, UploadProgressState } from '../types';
import { formatBytes } from '../utils/formatters';
import { segmentAndEncryptFile } from '../services/segmentation.service';
import { ApiService } from '../services/api.service';
import { PageId } from '../components/Sidebar';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { BlockVisualizer, VisualBlockItem } from '../components/BlockVisualizer';

interface SecureUploadPageProps {
  onSuccessNavigate: (page: PageId) => void;
  onShowToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
}

const BLOCK_OPTIONS: { label: string; size: BlockSizeOption; description: string }[] = [
  { label: '256 KB', size: 262144, description: 'High distribution granularity' },
  { label: '512 KB', size: 524288, description: 'Optimal for small/medium assets' },
  { label: '1 MB', size: 1048576, description: 'Balanced cloud throughput' },
  { label: '5 MB', size: 5242880, description: 'High-speed large payload blocks' },
];

export const SecureUploadPage: React.FC<SecureUploadPageProps> = ({ onSuccessNavigate, onShowToast }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [blockSize, setBlockSize] = useState<BlockSizeOption>(524288); // 512KB default
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [visualBlocks, setVisualBlocks] = useState<VisualBlockItem[]>([]);

  const [progress, setProgress] = useState<UploadProgressState>({
    stage: 'idle',
    currentBlock: 0,
    totalBlocks: 0,
    bytesProcessed: 0,
    totalBytes: 0,
    percentage: 0,
    message: 'Ready for upload',
  });

  const [uploadedResult, setUploadedResult] = useState<{
    fileId: string;
    originalSha256: string;
    totalBlocks: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadedResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadedResult(null);
    }
  };

  const calculateBlocks = () => {
    if (!selectedFile) return 0;
    if (selectedFile.size === 0) return 0;
    return Math.ceil(selectedFile.size / blockSize);
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setIsProcessing(false);
      setProgress((prev) => ({
        ...prev,
        stage: 'cancelled',
        message: 'Upload cancelled by user',
      }));
      onShowToast('warning', 'Upload Cancelled', 'The encryption and upload pipeline was aborted.');
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) {
      onShowToast('error', 'No File Selected', 'Please choose a file to encrypt and upload.');
      return;
    }

    if (!password || password.length < 4) {
      onShowToast('error', 'Password Required', 'Please enter an encryption password of at least 4 characters.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsProcessing(true);
    setUploadedResult(null);

    try {
      // Step 1: Segmentation and Client-Side Encryption
      setProgress({
        stage: 'segmenting',
        currentBlock: 0,
        totalBlocks: calculateBlocks(),
        bytesProcessed: 0,
        totalBytes: selectedFile.size,
        percentage: 10,
        message: 'Initializing cryptographic segmentation and PBKDF2 key derivation...',
      });

      const segmentationResult = await segmentAndEncryptFile(
        selectedFile,
        password,
        blockSize,
        'user-default',
        (currBlock, totalBlk, bytes, total, stageName) => {
          const encPercent = totalBlk > 0 ? Math.round((currBlock / totalBlk) * 40) + 10 : 20;
          setProgress({
            stage: 'encrypting',
            currentBlock: currBlock,
            totalBlocks: totalBlk,
            bytesProcessed: bytes,
            totalBytes: total,
            percentage: encPercent,
            message: stageName,
          });
        },
        controller.signal
      );

      // Populate visual blocks for interactive inspector
      const vBlocks: VisualBlockItem[] = segmentationResult.encryptedBlocks.map((b) => ({
        index: b.index,
        size: b.metadata.originalSize,
        ciphertextSize: b.metadata.ciphertextSize,
        nonce: b.metadata.nonce,
        tag: b.metadata.tag,
        sha256: b.metadata.sha256Plaintext,
        status: 'encrypted',
      }));
      setVisualBlocks(vBlocks);

      // Step 2: Initiate Session with Backend API
      setProgress((prev) => ({
        ...prev,
        stage: 'uploading',
        message: 'Registering upload session with cloud storage provider...',
        percentage: 55,
      }));

      await ApiService.initiateUpload(segmentationResult.manifest);

      // Step 3: Cloud Upload Blocks
      const totalBlocks = segmentationResult.encryptedBlocks.length;
      for (let i = 0; i < totalBlocks; i++) {
        if (controller.signal.aborted) {
          throw new Error('Upload aborted by user');
        }

        const block = segmentationResult.encryptedBlocks[i];
        const uploadPercent = 55 + Math.round(((i + 1) / (totalBlocks || 1)) * 35);

        setProgress({
          stage: 'uploading',
          currentBlock: i + 1,
          totalBlocks: totalBlocks,
          bytesProcessed: (i + 1) * blockSize,
          totalBytes: selectedFile.size,
          percentage: uploadPercent,
          message: `Uploading encrypted block ${i + 1} of ${totalBlocks} to cloud object storage...`,
        });

        await ApiService.uploadBlock(
          segmentationResult.manifest.fileId,
          block.index,
          block.combinedPayload
        );
      }

      // Step 4: Verification and Manifest Finalization
      setProgress({
        stage: 'verifying',
        currentBlock: totalBlocks,
        totalBlocks: totalBlocks,
        bytesProcessed: selectedFile.size,
        totalBytes: selectedFile.size,
        percentage: 95,
        message: 'Verifying authenticated manifest and persisting cloud record...',
      });

      await ApiService.completeUpload(
        segmentationResult.manifest.fileId,
        segmentationResult.manifest
      );

      // Final Success
      setProgress({
        stage: 'completed',
        currentBlock: totalBlocks,
        totalBlocks: totalBlocks,
        bytesProcessed: selectedFile.size,
        totalBytes: selectedFile.size,
        percentage: 100,
        message: 'File successfully encrypted, segmented, and stored in the cloud!',
      });

      setUploadedResult({
        fileId: segmentationResult.manifest.fileId,
        originalSha256: segmentationResult.manifest.originalSha256,
        totalBlocks: segmentationResult.manifest.totalBlocks,
      });

      onShowToast(
        'success',
        'Upload Successful',
        `File "${selectedFile.name}" stored across ${segmentationResult.manifest.totalBlocks} encrypted blocks.`
      );
    } catch (err: any) {
      if (!controller.signal.aborted) {
        console.error('Upload failed:', err);
        setProgress((prev) => ({
          ...prev,
          stage: 'error',
          error: err.message || 'Encryption or upload failed',
          message: 'An error occurred during the secure upload pipeline.',
        }));
        onShowToast('error', 'Upload Error', err.message || 'Operation failed');
      }
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  };

  const pipelineStages = [
    { key: 'select', label: '1. File Selected', active: !!selectedFile },
    { key: 'segment', label: '2. Segmentation', active: progress.stage !== 'idle' },
    {
      key: 'encrypt',
      label: '3. AES-256-GCM',
      active: ['encrypting', 'uploading', 'verifying', 'completed'].includes(progress.stage),
    },
    {
      key: 'upload',
      label: '4. Cloud Upload',
      active: ['uploading', 'verifying', 'completed'].includes(progress.stage),
    },
    { key: 'verify', label: '5. Verification', active: progress.stage === 'completed' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-vault-100 tracking-tight">Secure Segmented Cloud Upload</h2>
        <p className="text-sm text-vault-500 mt-1">
          Select any file to divide it into encrypted cryptographic segments using AES-256-GCM and store it safely in
          Amazon S3.
        </p>
      </div>

      {/* Visual Pipeline Bar */}
      <div className="p-4 rounded-xl bg-vault-900 border border-vault-800">
        <div className="text-xs font-semibold text-vault-500 uppercase tracking-wider mb-3">
          Upload & Encryption Pipeline
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.key}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-all ${
                stage.active
                  ? 'bg-vault-bronze/10 border-vault-700/60 text-vault-300'
                  : 'bg-vault-850/50 border-vault-800/80 text-vault-600'
              }`}
            >
              <span>{stage.label}</span>
              {stage.active && <CheckCircle2 className="w-3.5 h-3.5 text-vault-400" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: File Selection & Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 shadow-glow-amber'
                : 'border-vault-700/80 hover:border-amber-500/50 bg-vault-900/80'
            } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />

            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <UploadCloud className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-base font-semibold text-amber-50 break-words">{selectedFile.name}</p>
                <p className="text-xs text-vault-400 font-mono">
                  {formatBytes(selectedFile.size)} &bull; {selectedFile.type || 'Binary / Document'}
                </p>
                <p className="text-xs text-amber-400 pt-2 font-medium">Click or drag a new file to change</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-base font-medium text-amber-100">
                  Drag and drop your file here, or <span className="text-amber-400 hover:underline">browse</span>
                </p>
                <p className="text-xs text-vault-400">
                  Supports all binary formats: PDFs, documents, archives, images, videos (up to 100 MB)
                </p>
              </div>
            )}
          </div>

          {/* Block Size Configuration */}
          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-amber-50 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-400" /> Block Size Selection
                </label>
                <p className="text-xs text-vault-400 mt-0.5">
                  The file will be segmented into blocks of this size before encryption
                </p>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                N = {calculateBlocks()} blocks
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BLOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.size}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setBlockSize(opt.size)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    blockSize === opt.size
                      ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-glow-amber'
                      : 'bg-vault-850/80 border-vault-800 text-vault-400 hover:border-vault-700'
                  }`}
                >
                  <div className="font-semibold text-sm text-amber-300">{opt.label}</div>
                  <div className="text-[11px] text-vault-400 mt-1 leading-tight">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Encryption Password */}
          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
            <div>
              <label className="text-sm font-semibold text-amber-50 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" /> Encryption Password
              </label>
              <p className="text-xs text-vault-400 mt-0.5">
                Master password used for PBKDF2-SHA256 key derivation. Never transmitted to the cloud.
              </p>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isProcessing}
                placeholder="Enter a strong encryption passphrase..."
                className="w-full px-4 py-3 rounded-xl bg-vault-850 border border-vault-700 text-vault-100 placeholder-vault-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition pr-12 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-vault-400 hover:text-amber-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Dynamic Interactive Password Strength Meter */}
            <PasswordStrengthMeter password={password} />

            <div className="flex items-center justify-between text-xs text-vault-500 font-mono">
              <span>PBKDF2: 100,000 iterations + SHA-256</span>
              <span>Unique 256-bit salt</span>
            </div>
          </div>

          {/* Interactive Block Visualizer Matrix */}
          {selectedFile && calculateBlocks() > 0 && (
            <BlockVisualizer
              totalBlocks={calculateBlocks()}
              currentProcessingIndex={progress.currentBlock > 0 ? progress.currentBlock - 1 : -1}
              blockSizeBytes={blockSize}
              blocks={visualBlocks}
            />
          )}
        </div>

        {/* Right Column: Execution & Progress */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-5">
            <h3 className="text-base font-semibold text-vault-100">Upload Action</h3>

            <div className="space-y-3 text-xs text-vault-500">
              <div className="flex justify-between py-1.5 border-b border-vault-800">
                <span>Selected File:</span>
                <span className="text-slate-200 font-mono truncate max-w-[150px]">
                  {selectedFile ? selectedFile.name : 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-vault-800">
                <span>Original Size:</span>
                <span className="text-slate-200 font-mono">
                  {selectedFile ? formatBytes(selectedFile.size) : '0 Bytes'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-vault-800">
                <span>Block Granularity:</span>
                <span className="text-slate-200 font-mono">{formatBytes(blockSize)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-vault-800">
                <span>Estimated Blocks:</span>
                <span className="text-vault-bronze font-mono font-bold">{calculateBlocks()}</span>
              </div>
            </div>

            {/* Progress Display */}
            {isProcessing && (
              <div className="space-y-2 pt-2">
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
                {progress.totalBlocks > 0 && (
                  <p className="text-[11px] text-vault-500 text-right font-mono">
                    Block {progress.currentBlock} of {progress.totalBlocks}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              {!isProcessing ? (
                <button
                  onClick={handleStartUpload}
                  disabled={!selectedFile || !password}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                    selectedFile && password
                      ? 'bg-amber-500 hover:bg-amber-400 text-vault-950 shadow-lg shadow-amber-500/25'
                      : 'bg-vault-800 text-vault-500 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" /> Start Secure Upload
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="w-full py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Cancel Upload
                </button>
              )}
            </div>
          </div>

          {/* Success Card */}
          {uploadedResult && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" /> File Secured & Uploaded!
              </div>
              <div className="text-xs space-y-1.5 font-mono text-vault-400">
                <p>
                  <span className="text-vault-500">File ID:</span> {uploadedResult.fileId}
                </p>
                <p>
                  <span className="text-vault-500">Total Blocks:</span> {uploadedResult.totalBlocks}
                </p>
                <p className="break-all">
                  <span className="text-vault-500">SHA-256 Digest:</span>
                  <br />
                  <span className="text-emerald-300">{uploadedResult.originalSha256}</span>
                </p>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => onSuccessNavigate('files')}
                  className="w-full py-2 rounded-lg bg-emerald-500 text-vault-950 font-medium text-xs hover:bg-emerald-400 transition"
                >
                  View in My Files &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
