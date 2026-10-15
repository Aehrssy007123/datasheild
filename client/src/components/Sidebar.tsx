import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FolderLock,
  DownloadCloud,
  Cpu,
  Globe2,
  Settings2,
  BookOpen,
  ShieldCheck,
  Server,
  Cloud,
  Zap,
} from 'lucide-react';
import { CloudStatusInfo } from '../types';

export type PageId =
  | 'dashboard'
  | 'upload'
  | 'files'
  | 'downloads'
  | 'encryption-lab'
  | 'cdn-analytics'
  | 'cloud-config'
  | 'documentation';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  cloudStatus: CloudStatusInfo | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage, cloudStatus }) => {
  const navItems = [
    { id: 'dashboard'      as PageId, label: 'Dashboard',         icon: LayoutDashboard },
    { id: 'upload'         as PageId, label: 'Secure Upload',      icon: UploadCloud     },
    { id: 'files'          as PageId, label: 'My Files',           icon: FolderLock      },
    { id: 'downloads'      as PageId, label: 'Downloads & Decrypt',icon: DownloadCloud   },
    { id: 'encryption-lab' as PageId, label: 'Encryption Lab',     icon: Cpu             },
    { id: 'cdn-analytics'  as PageId, label: 'CDN Analytics',      icon: Globe2          },
    { id: 'cloud-config'   as PageId, label: 'Cloud Configuration',icon: Settings2       },
    { id: 'documentation'  as PageId, label: 'Project Docs & Viva',icon: BookOpen        },
  ];

  return (
    <aside
      className="w-64 flex flex-col justify-between h-screen sticky top-0 select-none z-30"
      style={{
        background: 'linear-gradient(180deg, #16100b 0%, #0d0906 100%)',
        borderRight: '1px solid rgba(77, 50, 32, 0.55)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
      }}
    >
      <div>
        {/* Brand Logo */}
        <div
          className="p-5 flex items-center space-x-3"
          style={{ borderBottom: '1px solid rgba(59, 38, 24, 0.7)' }}
        >
          {/* Animated Logo Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #d4904e 0%, #c07830 50%, #a8651e 100%)',
              boxShadow: '0 4px 18px -4px rgba(212, 144, 78, 0.6)',
            }}
          >
            <ShieldCheck className="w-5 h-5 text-amber-950 font-bold relative z-10" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight flex items-center gap-1.5" style={{ color: '#f9efe4' }}>
              SecureVault{' '}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{
                  background: 'rgba(212, 144, 78, 0.18)',
                  color: '#f0b865',
                  border: '1px solid rgba(212, 144, 78, 0.35)',
                }}
              >
                v1.0
              </span>
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#9a6641' }}>
              Cloud Cryptography Suite
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, rgba(212,144,78,0.18) 0%, rgba(201,124,53,0.10) 100%)',
                        border: '1px solid rgba(212, 144, 78, 0.40)',
                        color: '#f0b865',
                        boxShadow: 'inset 2px 0 0 rgba(212,144,78,0.7), 0 2px 12px -4px rgba(212,144,78,0.3)',
                      }
                    : {
                        border: '1px solid transparent',
                        color: '#9a6641',
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(59, 38, 24, 0.45)';
                    (e.currentTarget as HTMLElement).style.color = '#ddb898';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(77, 50, 32, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = '#9a6641';
                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                  }
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? '#f0b865' : '#6b4429' }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status */}
      <div
        className="p-4"
        style={{ borderTop: '1px solid rgba(59, 38, 24, 0.6)', background: 'rgba(13, 9, 6, 0.5)' }}
      >
        <div
          className="rounded-xl p-3"
          style={{
            background: 'rgba(22, 16, 11, 0.85)',
            border: '1px solid rgba(59, 38, 24, 0.7)',
          }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5" style={{ color: '#9a6641' }}>
              {cloudStatus?.storageProvider === 's3' ? (
                <Cloud className="w-3.5 h-3.5" style={{ color: '#d4904e' }} />
              ) : (
                <Server className="w-3.5 h-3.5" style={{ color: '#c97c35' }} />
              )}
              Storage Mode
            </span>
            <span
              className="font-mono px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold"
              style={{
                background: 'rgba(212, 144, 78, 0.15)',
                color: '#f0b865',
                border: '1px solid rgba(212, 144, 78, 0.28)',
              }}
            >
              {cloudStatus?.storageProvider === 's3' ? 'AWS S3 (Live)' : 'Local Adapter'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]" style={{ color: '#9a6641' }}>
            <span>CDN CloudFront:</span>
            <span
              style={{
                color: cloudStatus?.cloudFrontConfigured ? '#34d399' : '#6b4429',
                fontWeight: 500,
              }}
            >
              {cloudStatus?.cloudFrontConfigured ? 'Active (HTTPS)' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Encryption Badge */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <Zap className="w-3 h-3" style={{ color: '#6b4429' }} />
          <span className="text-[10px] font-mono text-center" style={{ color: '#6b4429' }}>
            BE Computer Engineering Project
          </span>
        </div>
      </div>
    </aside>
  );
};
