import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Search,
  DownloadCloud,
  Trash2,
  FileCode,
  ShieldCheck,
  HardDrive,
  Calendar,
  Lock,
  ExternalLink,
  Boxes,
  X,
  RefreshCw,
} from 'lucide-react';
import { FileRecord, FileManifest } from '../types';
import { ApiService } from '../services/api.service';
import { formatBytes, formatDate, truncateHash } from '../utils/formatters';
import { PageId } from '../components/Sidebar';

interface MyFilesPageProps {
  onNavigateToDownload: (fileId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
}

export const MyFilesPage: React.FC<MyFilesPageProps> = ({ onNavigateToDownload, onShowToast }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedManifest, setSelectedManifest] = useState<FileManifest | null>(null);
  const [manifestLoading, setManifestLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await ApiService.listFiles();
      setFiles(data);
    } catch (err: any) {
      console.error('Failed to load files:', err);
      onShowToast('error', 'Failed to load files', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${fileName}" and all its encrypted blocks?`)) {
      return;
    }

    try {
      setDeletingId(fileId);
      await ApiService.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
      onShowToast('success', 'File Deleted', `"${fileName}" and all stored blocks were removed.`);
    } catch (err: any) {
      console.error('Delete failed:', err);
      onShowToast('error', 'Delete Failed', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleInspectManifest = async (fileId: string) => {
    try {
      setManifestLoading(true);
      const manifest = await ApiService.getManifest(fileId);
      setSelectedManifest(manifest);
    } catch (err: any) {
      console.error('Failed to load manifest:', err);
      onShowToast('error', 'Manifest Inaccessible', err.message);
    } finally {
      setManifestLoading(false);
    }
  };

  const filteredFiles = files.filter(
    (f) =>
      f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.fileId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-vault-100 tracking-tight">Encrypted Files Repository</h2>
          <p className="text-sm text-vault-500 mt-1">
            Browse encrypted objects stored in cloud storage. Access requires valid PBKDF2 decryption key.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-vault-500" />
            <input
              type="text"
              placeholder="Search by file name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl bg-vault-900 border border-vault-800 text-sm text-vault-100 placeholder-vault-600 focus:outline-none focus:border-vault-accent focus:ring-1 focus:ring-vault-accent w-64 transition"
            />
          </div>

          <button
            onClick={loadFiles}
            className="p-2 rounded-xl bg-vault-900 border border-vault-800 text-vault-400 hover:text-vault-100 hover:bg-vault-800 transition"
            title="Refresh Files"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-vault-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Files Table Card */}
      <div className="rounded-2xl bg-vault-900 border border-vault-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-vault-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-vault-400" />
              <p className="text-sm">Fetching encrypted files from cloud storage...</p>
            </div>
          ) : filteredFiles.length > 0 ? (
            <table className="w-full text-left text-sm text-vault-400">
              <thead className="text-xs uppercase bg-vault-950/80 text-vault-500 border-b border-vault-800">
                <tr>
                  <th className="px-6 py-4">File Name & ID</th>
                  <th className="px-6 py-4">Original Size</th>
                  <th className="px-6 py-4">Blocks</th>
                  <th className="px-6 py-4">Encryption</th>
                  <th className="px-6 py-4">Cloud Storage</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vault-800/60 font-sans">
                {filteredFiles.map((file) => (
                  <tr key={file.fileId} className="hover:bg-vault-850/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-vault-bronze/10 text-vault-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-vault-100">{file.fileName}</div>
                          <div className="text-[11px] font-mono text-vault-500">{file.fileId}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-200">
                      {formatBytes(file.originalSize)}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs bg-vault-800 border border-vault-700/60 font-mono text-vault-400">
                        <Boxes className="w-3 h-3 text-vault-bronze" />
                        {file.totalBlocks} blocks
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-vault-700/20 text-vault-400 border border-vault-600/35 font-mono">
                          {file.encryptionAlgorithm}
                        </span>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Integrity Verified
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium ${
                          file.storageProvider === 's3'
                            ? 'bg-vault-bronze/10 text-vault-400 border border-vault-700/50'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {file.storageProvider === 's3' ? 'AWS S3' : 'Local Adapter'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-vault-500">
                      {formatDate(file.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Inspect Manifest */}
                        <button
                          onClick={() => handleInspectManifest(file.fileId)}
                          className="p-2 rounded-lg bg-vault-800 hover:bg-vault-700 border border-vault-700 text-vault-400 hover:text-vault-100 transition"
                          title="View Authenticated Manifest"
                        >
                          <FileCode className="w-4 h-4 text-vault-bronze" />
                        </button>

                        {/* Download & Decrypt */}
                        <button
                          onClick={() => onNavigateToDownload(file.fileId)}
                          className="p-2 rounded-lg bg-vault-bronze/10 hover:bg-vault-bronze/15 border border-vault-700/60 text-vault-400 transition"
                          title="Decrypt and Reconstruct"
                        >
                          <DownloadCloud className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(file.fileId, file.fileName)}
                          disabled={deletingId === file.fileId}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition disabled:opacity-50"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-vault-600 space-y-2">
              <FolderLock className="w-10 h-10 mx-auto text-vault-700 stroke-1" />
              <p className="text-base font-medium text-vault-500">No encrypted files found</p>
              <p className="text-xs text-vault-600">
                {searchQuery ? 'Try adjusting your search filter.' : 'Upload a file using the Secure Upload workflow.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manifest Viewer Modal */}
      {selectedManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-vault-900 border border-vault-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-vault-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-vault-bronze" />
                <h3 className="font-semibold text-vault-100">
                  Authenticated Manifest &mdash; {selectedManifest.fileName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedManifest(null)}
                className="text-vault-500 hover:text-vault-100 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4 text-vault-400">
                <div>
                  <span className="text-vault-600">File ID:</span> {selectedManifest.fileId}
                </div>
                <div>
                  <span className="text-vault-600">Algorithm:</span> {selectedManifest.encryption.algorithm}
                </div>
                <div>
                  <span className="text-vault-600">Total Blocks:</span> {selectedManifest.totalBlocks}
                </div>
                <div>
                  <span className="text-vault-600">Block Size:</span> {formatBytes(selectedManifest.blockSize)}
                </div>
                <div>
                  <span className="text-vault-600">PBKDF2 Iterations:</span>{' '}
                  {selectedManifest.encryption.kdf.iterations}
                </div>
                <div>
                  <span className="text-vault-600">Salt (Base64):</span>{' '}
                  <span className="text-vault-400 truncate inline-block max-w-[150px]">
                    {selectedManifest.encryption.kdf.salt}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-vault-600">Original SHA-256 Digest:</span>
                <div className="mt-1 p-2 rounded bg-vault-950 text-emerald-400 break-all border border-vault-800">
                  {selectedManifest.originalSha256}
                </div>
              </div>

              <div>
                <span className="text-vault-600">Raw JSON Manifest Structure:</span>
                <pre className="mt-1 p-4 rounded-xl bg-vault-950 text-vault-400 overflow-x-auto max-h-60 border border-vault-800">
                  {JSON.stringify(selectedManifest, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-vault-800 bg-vault-950/60 flex justify-end">
              <button
                onClick={() => setSelectedManifest(null)}
                className="px-4 py-2 rounded-xl bg-vault-800 hover:bg-vault-700 text-vault-100 text-xs font-medium"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
