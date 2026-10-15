import React from 'react';
import { RefreshCw, KeyRound, User, Shield } from 'lucide-react';
import { CloudStatusInfo } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  cloudStatus: CloudStatusInfo | null;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  cloudStatus,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header
      className="h-16 sticky top-0 z-20 px-8 flex items-center justify-between"
      style={{
        background: 'linear-gradient(90deg, rgba(22,16,11,0.95) 0%, rgba(28,20,14,0.92) 100%)',
        borderBottom: '1px solid rgba(77, 50, 32, 0.55)',
        backdropFilter: 'blur(20px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      {/* Title Area */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(212,144,78,0.22), rgba(107,68,41,0.15))',
            border: '1px solid rgba(212, 144, 78, 0.35)',
          }}
        >
          <Shield className="w-4 h-4" style={{ color: '#d4904e' }} />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight leading-tight" style={{ color: '#f9efe4' }}>
            {title}
          </h2>
          <p className="text-[11px] leading-none mt-0.5" style={{ color: '#9a6641' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Cloud & Storage Status"
          className="p-2 rounded-xl transition-all duration-200"
          style={{
            background: 'rgba(28, 20, 14, 0.8)',
            border: '1px solid rgba(59, 38, 24, 0.7)',
            color: '#9a6641',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212, 144, 78, 0.5)';
            (e.currentTarget as HTMLElement).style.color = '#d4904e';
            (e.currentTarget as HTMLElement).style.background = 'rgba(44, 29, 19, 0.9)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 38, 24, 0.7)';
            (e.currentTarget as HTMLElement).style.color = '#9a6641';
            (e.currentTarget as HTMLElement).style.background = 'rgba(28, 20, 14, 0.8)';
          }}
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ color: isRefreshing ? '#d4904e' : 'currentColor' }}
          />
        </button>

        {/* Cryptography Badge */}
        <div
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium"
          style={{
            background: 'rgba(212, 144, 78, 0.1)',
            border: '1px solid rgba(212, 144, 78, 0.28)',
            color: '#f0b865',
          }}
        >
          <KeyRound className="w-3.5 h-3.5" style={{ color: '#d4904e' }} />
          <span>AES-256-GCM + PBKDF2</span>
        </div>

        {/* Storage Indicator */}
        <div
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium font-mono"
          style={
            cloudStatus?.storageProvider === 's3' && cloudStatus.bucketAccessible
              ? {
                  background: 'rgba(212, 144, 78, 0.1)',
                  border: '1px solid rgba(212, 144, 78, 0.3)',
                  color: '#f0b865',
                }
              : {
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  color: '#34d399',
                }
          }
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background:
                cloudStatus?.storageProvider === 's3' && cloudStatus.bucketAccessible
                  ? '#d4904e'
                  : '#34d399',
              animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
            }}
          />
          <span>
            {cloudStatus?.storageProvider === 's3'
              ? `AWS S3: ${cloudStatus.awsRegion}`
              : 'Local S3 Adapter'}
          </span>
        </div>

        {/* User Badge */}
        <div
          className="flex items-center space-x-2 pl-2.5"
          style={{ borderLeft: '1px solid rgba(59, 38, 24, 0.6)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(212,144,78,0.2), rgba(107,68,41,0.15))',
              border: '1px solid rgba(77, 50, 32, 0.7)',
            }}
          >
            <User className="w-3.5 h-3.5" style={{ color: '#d4904e' }} />
          </div>
          <span className="hidden md:inline text-sm font-medium" style={{ color: '#ddb898' }}>
            Demo User
          </span>
        </div>
      </div>
    </header>
  );
};
