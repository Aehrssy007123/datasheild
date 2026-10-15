import React, { useState } from 'react';
import { Boxes, CheckCircle2, Lock, Eye, X, Shield, Cpu, KeyRound } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

export interface VisualBlockItem {
  index: number;
  size: number;
  ciphertextSize?: number;
  nonce?: string;
  tag?: string;
  sha256?: string;
  status: 'pending' | 'processing' | 'encrypted' | 'uploaded' | 'verified' | 'error';
}

interface BlockVisualizerProps {
  totalBlocks: number;
  currentProcessingIndex?: number;
  blocks?: VisualBlockItem[];
  blockSizeBytes: number;
  fileId?: string;
}

export const BlockVisualizer: React.FC<BlockVisualizerProps> = ({
  totalBlocks,
  currentProcessingIndex = -1,
  blocks = [],
  blockSizeBytes,
  fileId = 'sec_session',
}) => {
  const [inspectedBlock, setInspectedBlock] = useState<VisualBlockItem | null>(null);

  if (totalBlocks <= 0) return null;

  // Generate visual block items if not fully supplied
  const visualItems: VisualBlockItem[] = Array.from({ length: totalBlocks }, (_, i) => {
    const existing = blocks.find((b) => b.index === i);
    if (existing) return existing;

    let status: VisualBlockItem['status'] = 'pending';
    if (currentProcessingIndex === i) status = 'processing';
    else if (currentProcessingIndex > i) status = 'verified';

    return {
      index: i,
      size: blockSizeBytes,
      status,
    };
  });

  return (
    <div className="p-5 rounded-2xl bg-vault-900/90 border border-vault-800 space-y-4 relative overflow-hidden backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-vault-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-vault-bronze/10 text-vault-400">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-vault-100">Interactive Segment Block Matrix</h4>
            <p className="text-[11px] text-vault-500">Click any block to inspect cryptographic nonce, tag & AAD</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-vault-500">
            <span className="w-2 h-2 rounded-full bg-slate-700" /> Pending
          </span>
          <span className="flex items-center gap-1.5 text-vault-400">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" /> Active
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Secured
          </span>
        </div>
      </div>

      {/* Grid of Blocks */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-1">
        {visualItems.map((item) => {
          const isActive = currentProcessingIndex === item.index;
          const isDone = item.status === 'verified' || item.status === 'uploaded' || currentProcessingIndex > item.index;

          let blockClass = 'bg-vault-850/80 border-vault-800 text-vault-500 hover:border-slate-600';
          if (isActive) {
            blockClass = 'bg-vault-bronze/15 border-vault-accent text-vault-300 shadow-glow-cyan animate-pulse';
          } else if (isDone) {
            blockClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-400';
          }

          return (
            <button
              key={item.index}
              type="button"
              onClick={() => setInspectedBlock(item)}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 group relative ${blockClass}`}
            >
              <div className="text-[11px] font-mono font-bold tracking-tight">#{item.index}</div>
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : isActive ? (
                <Lock className="w-3.5 h-3.5 text-vault-400 animate-spin" />
              ) : (
                <Lock className="w-3 h-3 text-vault-700 group-hover:text-vault-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Block Inspector Modal / Drawer */}
      {inspectedBlock && (
        <div className="p-4 rounded-xl bg-vault-950 border border-vault-700/60 text-xs font-mono space-y-3 relative animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-vault-800 pb-2">
            <span className="font-bold text-vault-400 flex items-center gap-1.5 font-sans">
              <Shield className="w-4 h-4 text-vault-400" /> Block #{inspectedBlock.index} Cryptographic Inspector
            </span>
            <button
              onClick={() => setInspectedBlock(null)}
              className="text-vault-500 hover:text-vault-100 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-vault-400">
            <div>
              <span className="text-vault-600">Plaintext Size:</span> {formatBytes(inspectedBlock.size)}
            </div>
            <div>
              <span className="text-vault-600">Ciphertext Payload:</span>{' '}
              {inspectedBlock.ciphertextSize ? formatBytes(inspectedBlock.ciphertextSize) : 'Plaintext + 16B Tag'}
            </div>
            <div className="truncate">
              <span className="text-vault-600">Nonce (96-bit IV):</span>{' '}
              <span className="text-vault-bronze">{inspectedBlock.nonce || 'Generated per-block via CryptoRNG'}</span>
            </div>
            <div className="truncate">
              <span className="text-vault-600">GHASH Auth Tag:</span>{' '}
              <span className="text-emerald-400">{inspectedBlock.tag || '128-bit Poly1305/GHASH tag'}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-vault-900 border border-vault-800 text-[11px] text-vault-500 break-all">
            <span className="text-vault-600 block mb-0.5">Additional Authenticated Data (AAD):</span>
            <code className="text-violet-300">
              SecureVault|v1|file:{fileId}|block:{inspectedBlock.index}|total:{totalBlocks}
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
