import React from 'react';
import { Lock, Unlock, ShieldAlert, ShieldCheck, KeyRound, Cpu, CheckCircle2, Zap } from 'lucide-react';
import { DownloadProgressState } from '../types';

interface VaultLockDialProps {
  progress: DownloadProgressState;
  isUnlocked: boolean;
  hasError: boolean;
}

export const VaultLockDial: React.FC<VaultLockDialProps> = ({ progress, isUnlocked, hasError }) => {
  const getStageNumber = () => {
    switch (progress.stage) {
      case 'fetching_manifest':
        return 1;
      case 'downloading_blocks':
        return 2;
      case 'deriving_key':
        return 3;
      case 'decrypting':
      case 'reconstructing':
        return 4;
      case 'verifying_hash':
      case 'completed':
        return 5;
      default:
        return 0;
    }
  };

  const currentStageNum = getStageNumber();

  let ringColor = 'border-slate-800 text-vault-600';
  let centerIcon = <Lock className="w-8 h-8 text-vault-600" />;
  let statusText = 'Vault Locked (AES-256-GCM)';

  if (hasError) {
    ringColor = 'border-rose-500/50 text-rose-400 shadow-glow-rose';
    centerIcon = <ShieldAlert className="w-10 h-10 text-rose-400 animate-bounce" />;
    statusText = 'SECURITY LOCKDOWN: TAG MISMATCH';
  } else if (isUnlocked) {
    ringColor = 'border-emerald-500/50 text-emerald-400 shadow-glow-emerald';
    centerIcon = <Unlock className="w-10 h-10 text-emerald-400 animate-pulse" />;
    statusText = 'VAULT UNLOCKED: SHA-256 VERIFIED';
  } else if (currentStageNum > 0) {
    ringColor = 'border-sky-500/50 text-vault-400 shadow-glow-cyan';
    centerIcon = <KeyRound className="w-8 h-8 text-vault-400 animate-spin" />;
    statusText = progress.message;
  }

  const stages = [
    { num: 1, label: 'Manifest' },
    { num: 2, label: 'Blocks S3' },
    { num: 3, label: 'PBKDF2 Key' },
    { num: 4, label: 'AES-GCM Auth' },
    { num: 5, label: 'SHA-256' },
  ];

  return (
    <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur">
      {/* Background ambient glow */}
      <div
        className={`absolute inset-0 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700 ${
          hasError ? 'bg-rose-500' : isUnlocked ? 'bg-emerald-500' : 'bg-vault-accent'
        }`}
      />

      {/* Cyber Mechanical Vault Dial */}
      <div className="relative w-48 h-48 my-4 flex items-center justify-center select-none">
        {/* Outer rotating ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-dashed ${ringColor} ${
            currentStageNum > 0 && !isUnlocked && !hasError ? 'animate-spin-slow' : ''
          }`}
        />

        {/* Inner concentric ring */}
        <div className="absolute inset-3 rounded-full border border-vault-700/60 flex items-center justify-center" />

        {/* Center vault hub */}
        <div
          className={`w-28 h-28 rounded-full bg-vault-950 border-2 ${ringColor} flex flex-col items-center justify-center transition-all duration-500 shadow-xl`}
        >
          {centerIcon}
          <span className="text-[10px] font-mono mt-1 font-bold tracking-wider uppercase">
            {isUnlocked ? 'SECURE' : hasError ? 'ALERT' : `${progress.percentage}%`}
          </span>
        </div>
      </div>

      <div className="text-center space-y-1 z-10">
        <h4
          className={`text-sm font-bold tracking-tight font-mono ${
            hasError ? 'text-rose-400' : isUnlocked ? 'text-emerald-400' : 'text-slate-200'
          }`}
        >
          {statusText}
        </h4>
        <p className="text-xs text-vault-500 max-w-xs">{progress.message}</p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-5 gap-1.5 w-full mt-6 pt-4 border-t border-vault-800">
        {stages.map((st) => {
          const isPassed = currentStageNum >= st.num;
          const isCurrent = currentStageNum === st.num;
          return (
            <div
              key={st.num}
              className={`p-2 rounded-lg border text-center transition-all ${
                isPassed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isCurrent
                  ? 'bg-vault-bronze/15 border-vault-accent text-vault-300 animate-pulse'
                  : 'bg-vault-850/40 border-vault-800/80 text-vault-600'
              }`}
            >
              <div className="text-[10px] font-mono font-bold">0{st.num}</div>
              <div className="text-[9px] truncate mt-0.5">{st.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
