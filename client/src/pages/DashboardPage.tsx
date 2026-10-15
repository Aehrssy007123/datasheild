import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  HardDrive,
  FileText,
  Boxes,
  Cloud,
  Server,
  ArrowUpRight,
  Lock,
  CheckCircle2,
  Layers,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { CloudStatusInfo, FileRecord } from '../types';
import { ApiService } from '../services/api.service';
import { formatBytes, formatDate } from '../utils/formatters';
import { PageId } from '../components/Sidebar';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
  cloudStatus: CloudStatusInfo | null;
}

// Rich Brown-to-Gold palette for charts
const CHART_COLORS = ['#d4904e', '#c97c35', '#e8924c', '#f0b865', '#10b981', '#b56528'];

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  glow: string;
}> = ({ label, value, sub, icon: Icon, iconBg, iconColor, glow }) => (
  <div
    className="p-5 rounded-2xl relative overflow-hidden group cursor-default transition-all duration-300"
    style={{
      background: 'linear-gradient(145deg, rgba(28,20,14,0.95), rgba(20,14,9,0.98))',
      border: '1px solid rgba(59, 38, 24, 0.7)',
      boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212, 144, 78, 0.45)';
      (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 45px -10px rgba(0,0,0,0.6), 0 0 30px -10px ${glow}`;
      (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 38, 24, 0.7)';
      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px -8px rgba(0,0,0,0.5)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
    }}
  >
    {/* Top shine line */}
    <div
      className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }}
    />
    {/* Ambient glow corner */}
    <div
      className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-all duration-500"
      style={{ background: glow }}
    />

    <div className="flex items-center justify-between relative z-10">
      <span
        className="text-[11px] font-semibold uppercase tracking-wider font-mono"
        style={{ color: '#9a6641' }}
      >
        {label}
      </span>
      <div
        className="p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110"
        style={{ background: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
    </div>
    <div className="mt-4 relative z-10">
      <div className="text-3xl font-bold font-mono tracking-tight" style={{ color: '#f9efe4' }}>
        {value}
      </div>
      <div className="text-xs mt-1.5 flex items-center gap-1.5 font-medium" style={{ color: '#9a6641' }}>
        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: iconColor }} />
        <span>{sub}</span>
      </div>
    </div>
  </div>
);

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate, cloudStatus }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => { loadFiles(); }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await ApiService.listFiles();
      setFiles(data);
    } catch (err) {
      console.error('Failed to load dashboard files:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalFiles        = files.length;
  const totalOriginalSize = files.reduce((acc, f) => acc + (f.originalSize  || 0), 0);
  const totalBlocks       = files.reduce((acc, f) => acc + (f.totalBlocks   || 0), 0);

  const typeGroups: Record<string, number> = {};
  files.forEach((f) => {
    const ext = f.fileName.split('.').pop()?.toUpperCase() || 'OTHER';
    typeGroups[ext] = (typeGroups[ext] || 0) + 1;
  });
  const fileTypeData         = Object.entries(typeGroups).map(([name, value]) => ({ name, value }));
  const blockDistributionData = files.slice(0, 6).map((f) => ({
    name:    f.fileName.length > 12 ? f.fileName.substring(0, 10) + '...' : f.fileName,
    blocks:  f.totalBlocks,
    sizeKb:  Math.round(f.originalSize / 1024),
  }));

  const tooltipStyle = {
    backgroundColor: '#1e1610',
    borderColor: '#4d3220',
    borderRadius: '10px',
    color: '#f0dfc0',
    fontSize: '12px',
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in">

      {/* ── Hero Banner ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-7 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e1610 0%, #2c1d13 40%, #1a1009 100%)',
          border: '1px solid rgba(77, 50, 32, 0.65)',
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,144,78,0.08)',
        }}
      >
        {/* Ambient orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #d4904e, transparent)' }} />
        <div className="absolute -bottom-12 left-20 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, #c97c35, transparent)' }} />

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(212,144,78,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,144,78,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 font-mono"
              style={{
                background: 'rgba(212, 144, 78, 0.15)',
                border: '1px solid rgba(212, 144, 78, 0.35)',
                color: '#f0b865',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero-Knowledge Client-Side Encryption
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#f9efe4' }}>
              Cloud Storage &amp; Distribution Dashboard
            </h2>
            <p className="text-sm mt-1.5 max-w-2xl leading-relaxed" style={{ color: '#9a6641' }}>
              Files are automatically sliced into cryptographic blocks, encrypted client-side using
              authenticated AES-256-GCM, and stored across cloud object storage with CloudFront CDN distribution.
            </p>

            {/* Live Stats Mini Row */}
            <div className="flex items-center gap-5 mt-4">
              {[
                { icon: Zap,      label: 'AES-256-GCM',   color: '#d4904e' },
                { icon: Activity, label: 'PBKDF2 (SHA-256)', color: '#c97c35' },
                { icon: Layers,   label: 'SHA-256 Verify', color: '#10b981' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs font-mono font-medium"
                  style={{ color: '#9a6641' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => onNavigate('upload')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #d4904e 0%, #c07830 50%, #a8651e 100%)',
                color: '#fef9f0',
                border: '1px solid rgba(212, 144, 78, 0.5)',
                boxShadow: '0 6px 22px -4px rgba(212, 144, 78, 0.5)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 30px -5px rgba(212,144,78,0.65)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 22px -4px rgba(212,144,78,0.5)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <ArrowUpRight className="w-4 h-4" /> Secure Upload
            </button>
            <button
              onClick={() => onNavigate('encryption-lab')}
              className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200"
              style={{
                background: 'rgba(44, 29, 19, 0.8)',
                border: '1px solid rgba(77, 50, 32, 0.6)',
                color: '#ddb898',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,144,78,0.4)';
                (e.currentTarget as HTMLElement).style.color = '#f0b865';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(77,50,32,0.6)';
                (e.currentTarget as HTMLElement).style.color = '#ddb898';
              }}
            >
              Encryption Lab
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Files"
          value={loading ? '…' : totalFiles}
          sub="AES-256-GCM secured"
          icon={FileText}
          iconBg="rgba(212, 144, 78, 0.14)"
          iconColor="#d4904e"
          glow="rgba(212,144,78,0.5)"
        />
        <StatCard
          label="Protected Data"
          value={loading ? '…' : formatBytes(totalOriginalSize)}
          sub="Zero-knowledge client encrypted"
          icon={HardDrive}
          iconBg="rgba(201, 124, 53, 0.14)"
          iconColor="#c97c35"
          glow="rgba(201,124,53,0.5)"
        />
        <StatCard
          label="Segmented Blocks"
          value={loading ? '…' : totalBlocks}
          sub="Unique 96-bit nonces"
          icon={Boxes}
          iconBg="rgba(181, 101, 40, 0.14)"
          iconColor="#b56528"
          glow="rgba(181,101,40,0.5)"
        />
        <StatCard
          label="Cloud Backend"
          value={cloudStatus?.storageProvider === 's3' ? 'AWS S3' : 'Local'}
          sub={cloudStatus?.storageProvider === 's3' ? `Region: ${cloudStatus.awsRegion}` : 'Zero-Cost Local Dev'}
          icon={cloudStatus?.storageProvider === 's3' ? Cloud : Server}
          iconBg="rgba(16, 185, 129, 0.12)"
          iconColor="#10b981"
          glow="rgba(16,185,129,0.4)"
        />
      </div>

      {/* ── Charts Section ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div
          className="lg:col-span-2 p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(145deg, rgba(22,16,11,0.95), rgba(14,9,6,0.98))',
            border: '1px solid rgba(59, 38, 24, 0.7)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold" style={{ color: '#f9efe4' }}>
                Segmented File Distribution
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#9a6641' }}>
                Block count per encrypted file
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-mono"
              style={{
                background: 'rgba(212, 144, 78, 0.1)',
                border: '1px solid rgba(212, 144, 78, 0.25)',
                color: '#f0b865',
              }}
            >
              <TrendingUp className="w-3 h-3" /> N = ⌈S / B⌉
            </div>
          </div>
          <div className="h-64 w-full">
            {blockDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={blockDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b4429" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b4429" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="blocks" radius={[6, 6, 0, 0]} name="Blocks Count">
                    {blockDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center" style={{ color: '#6b4429' }}>
                <Boxes className="w-10 h-10 stroke-1 mb-2" />
                <p className="text-sm">No files uploaded yet.</p>
                <button onClick={() => onNavigate('upload')}
                  className="mt-2 text-xs hover:underline" style={{ color: '#d4904e' }}>
                  Upload your first file &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div
          className="p-6 rounded-2xl flex flex-col justify-between"
          style={{
            background: 'linear-gradient(145deg, rgba(22,16,11,0.95), rgba(14,9,6,0.98))',
            border: '1px solid rgba(59, 38, 24, 0.7)',
          }}
        >
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#f9efe4' }}>File Types</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9a6641' }}>Encrypted content breakdown</p>
          </div>
          <div className="h-52 w-full my-auto flex items-center justify-center">
            {fileTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fileTypeData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={78} paddingAngle={4} dataKey="value"
                    strokeWidth={0}
                  >
                    {fileTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs" style={{ color: '#6b4429' }}>No data available</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid rgba(59,38,24,0.5)' }}>
            {fileTypeData.map((t, idx) => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs" style={{ color: '#9a6641' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                <span>{t.name} ({t.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Files Table ────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(22,16,11,0.95), rgba(14,9,6,0.98))',
          border: '1px solid rgba(59, 38, 24, 0.7)',
        }}
      >
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(59,38,24,0.6)' }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#f9efe4' }}>Recent Encrypted Files</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9a6641' }}>
              Files stored with authenticated manifest in object storage
            </p>
          </div>
          <button onClick={() => onNavigate('files')}
            className="text-xs font-medium flex items-center gap-1 transition-colors hover:underline"
            style={{ color: '#d4904e' }}>
            View all files &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          {files.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase font-mono"
                style={{ background: 'rgba(13,9,6,0.6)', color: '#6b4429', borderBottom: '1px solid rgba(59,38,24,0.5)' }}>
                <tr>
                  {['File Name', 'Original Size', 'Blocks', 'Algorithm', 'Storage', 'Date'].map((h) => (
                    <th key={h} className="px-6 py-3 tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {files.slice(0, 5).map((file) => (
                  <tr
                    key={file.fileId}
                    className="transition-colors duration-150"
                    style={{ borderBottom: '1px solid rgba(44,29,19,0.5)', color: '#ddb898' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,38,24,0.35)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td className="px-6 py-4 font-medium flex items-center gap-2" style={{ color: '#f9efe4' }}>
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#d4904e' }} />
                      {file.fileName}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{formatBytes(file.originalSize)}</td>
                    <td className="px-6 py-4 font-mono text-xs" style={{ color: '#f0b865' }}>
                      {file.totalBlocks} blocks
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono"
                        style={{ background: 'rgba(201,124,53,0.12)', color: '#f0b865', border: '1px solid rgba(201,124,53,0.25)' }}>
                        {file.encryptionAlgorithm}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono"
                        style={file.storageProvider === 's3'
                          ? { background: 'rgba(212,144,78,0.12)', color: '#d4904e', border: '1px solid rgba(212,144,78,0.25)' }
                          : { background: 'rgba(107,68,41,0.15)', color: '#c49070', border: '1px solid rgba(107,68,41,0.3)' }}>
                        {file.storageProvider === 's3' ? 'AWS S3' : 'Local'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: '#9a6641' }}>{formatDate(file.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-14 text-center text-sm" style={{ color: '#6b4429' }}>
              No files currently uploaded. Start by using the{' '}
              <button onClick={() => onNavigate('upload')} className="underline" style={{ color: '#d4904e' }}>
                Secure Upload
              </button>{' '}
              workflow.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
