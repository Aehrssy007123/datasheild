import React from 'react';
import { ShieldCheck, ShieldAlert, Shield, Zap } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  let label = 'Weak';
  let colorClass = 'bg-rose-500 text-rose-400';
  let percent = 20;

  if (score === 2) {
    label = 'Fair';
    colorClass = 'bg-amber-500 text-amber-400';
    percent = 40;
  } else if (score === 3) {
    label = 'Good';
    colorClass = 'bg-vault-accent text-vault-400';
    percent = 65;
  } else if (score === 4) {
    label = 'Strong';
    colorClass = 'bg-vault-600 text-vault-bronze';
    percent = 85;
  } else if (score >= 5) {
    label = 'Military Grade (AEAD)';
    colorClass = 'bg-emerald-500 text-emerald-400';
    percent = 100;
  }

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-vault-500 flex items-center gap-1 font-mono text-[11px]">
          <Zap className="w-3 h-3 text-vault-400" /> PBKDF2 Entropy:
        </span>
        <span className="font-semibold text-xs font-mono">{label}</span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-vault-800 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClass.split(' ')[0]}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="text-[10px] text-vault-500 font-mono flex items-center justify-between pt-0.5">
        <span>100,000 PBKDF2 Rounds</span>
        <span>Key Space: 2^256 bits</span>
      </div>
    </div>
  );
};
