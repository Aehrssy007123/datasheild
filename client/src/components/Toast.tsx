import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TOAST_STYLES = {
  success: { border: 'rgba(16,185,129,0.4)',  icon: '#34d399', IconCmp: CheckCircle2  },
  error:   { border: 'rgba(244,63,94,0.4)',   icon: '#fb7185', IconCmp: AlertCircle   },
  warning: { border: 'rgba(212,144,78,0.5)',  icon: '#f0b865', IconCmp: AlertTriangle },
  info:    { border: 'rgba(212,144,78,0.35)', icon: '#d4904e', IconCmp: Info          },
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const s = TOAST_STYLES[toast.type];
        const Icon = s.IconCmp;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 rounded-xl flex items-start space-x-3 animate-fade-in"
            style={{
              background: 'linear-gradient(145deg, rgba(28,20,14,0.97), rgba(18,12,8,0.99))',
              border: `1px solid ${s.border}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: `0 12px 40px -8px rgba(0,0,0,0.6), 0 0 0 1px ${s.border}`,
            }}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: s.icon }} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight" style={{ color: '#f9efe4' }}>{toast.title}</h4>
              {toast.message && (
                <p className="text-xs mt-1 break-words font-mono leading-relaxed" style={{ color: '#9a6641' }}>{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg transition-colors"
              style={{ color: '#6b4429' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#d4904e'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6b4429'; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
