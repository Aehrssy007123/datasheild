import React, { useState } from 'react';
import {
  Globe2,
  Zap,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Layers,
  Activity,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { CloudStatusInfo, LatencyTestResult } from '../types';
import { ApiService } from '../services/api.service';
import { CdnEdgeMap } from '../components/CdnEdgeMap';

interface CdnAnalyticsPageProps {
  cloudStatus: CloudStatusInfo | null;
}

export const CdnAnalyticsPage: React.FC<CdnAnalyticsPageProps> = ({ cloudStatus }) => {
  const [testing, setTesting] = useState<boolean>(false);
  const [originResult, setOriginResult] = useState<LatencyTestResult | null>(null);
  const [cdnResult, setCdnResult] = useState<LatencyTestResult | null>(null);
  const [customCdnDomain, setCustomCdnDomain] = useState<string>(cloudStatus?.cloudFrontDomain || '');

  const runLatencyComparison = async () => {
    setTesting(true);

    try {
      // 1. Measure Origin Server benchmark latency
      const originRes = await ApiService.testLatency('/api/cdn/benchmark', 'origin');
      setOriginResult(originRes);

      // 2. Measure CDN distribution if configured or entered
      const cdnUrl = customCdnDomain
        ? (customCdnDomain.startsWith('http') ? customCdnDomain : `https://${customCdnDomain}`)
        : '';

      if (cdnUrl) {
        const cdnRes = await ApiService.testLatency(cdnUrl, 'cdn');
        setCdnResult(cdnRes);
      } else {
        setCdnResult(null);
      }
    } catch (err) {
      console.error('Latency test error:', err);
    } finally {
      setTesting(false);
    }
  };

  const chartData = [
    ...(originResult
      ? [
          {
            name: 'Local / S3 Origin',
            totalLatency: originResult.durationMs,
            ttfb: originResult.ttfbMs,
          },
        ]
      : []),
    ...(cdnResult
      ? [
          {
            name: 'CloudFront Edge CDN',
            totalLatency: cdnResult.durationMs,
            ttfb: cdnResult.ttfbMs,
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-vault-100 tracking-tight flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-vault-400" /> Amazon CloudFront CDN & Content Distribution
        </h2>
        <p className="text-sm text-vault-500 mt-1">
          Monitor static website delivery, edge point-of-presence caching, HTTPS security, and real comparative latency.
        </p>
      </div>

      {/* CloudFront Status Banner */}
      <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-vault-100">CloudFront Distribution Status</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                  cloudStatus?.cloudFrontConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {cloudStatus?.cloudFrontConfigured ? 'Deployed & Active' : 'Pending AWS Configuration'}
              </span>
            </div>
            <p className="text-xs text-vault-500 mt-1 font-mono">
              Distribution Domain:{' '}
              {cloudStatus?.cloudFrontDomain ? (
                <span className="text-vault-400 font-semibold">{cloudStatus.cloudFrontDomain}</span>
              ) : (
                <span className="text-vault-600">Not configured in .env (CLOUDFRONT_DOMAIN)</span>
              )}
            </p>
          </div>

          {cloudStatus?.cloudFrontDomain && (
            <a
              href={`https://${cloudStatus.cloudFrontDomain}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-vault-bronze/10 hover:bg-vault-bronze/15 text-vault-400 border border-vault-700/60 text-xs font-medium flex items-center gap-2 transition"
            >
              Open Website <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Feature badges */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-vault-850/60 border border-vault-800 text-xs">
            <span className="text-vault-500 block text-[11px]">Security Protocol</span>
            <span className="text-emerald-400 font-semibold font-mono flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> HTTPS / TLS 1.3
            </span>
          </div>

          <div className="p-3 rounded-xl bg-vault-850/60 border border-vault-800 text-xs">
            <span className="text-vault-500 block text-[11px]">Origin Isolation</span>
            <span className="text-vault-400 font-semibold font-mono flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Origin Access Control (OAC)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-vault-850/60 border border-vault-800 text-xs">
            <span className="text-vault-500 block text-[11px]">Caching Behavior</span>
            <span className="text-vault-bronze font-semibold font-mono flex items-center gap-1 mt-0.5">
              <Layers className="w-3.5 h-3.5" /> CachingOptimized (Gzip/Brotli)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-vault-850/60 border border-vault-800 text-xs">
            <span className="text-vault-500 block text-[11px]">Edge Network</span>
            <span className="text-vault-100 font-semibold font-mono flex items-center gap-1 mt-0.5">
              <Globe2 className="w-3.5 h-3.5 text-vault-400" /> 600+ Global POPs
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Global Edge Topology Map */}
      <CdnEdgeMap />

      {/* Real Latency Benchmarking Tool */}
      <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-vault-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Live Latency Comparison Benchmark
            </h3>
            <p className="text-xs text-vault-500 mt-0.5">
              Performs real-time HTTP requests against the origin and the CDN edge to measure latency and inspect cache
              headers.
            </p>
          </div>

          <button
            onClick={runLatencyComparison}
            disabled={testing}
            className="px-4 py-2.5 rounded-xl bg-vault-accent hover:bg-vault-copper text-vault-950 font-bold text-xs transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} /> Run Latency Test
          </button>
        </div>

        {/* Custom Domain Input if testing live CDN */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Custom CloudFront domain (e.g. d1234567.cloudfront.net)..."
            value={customCdnDomain}
            onChange={(e) => setCustomCdnDomain(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl bg-vault-850 border border-vault-700 text-xs text-vault-100 placeholder-vault-600 font-mono focus:outline-none focus:border-vault-accent"
          />
        </div>

        {/* Results Chart */}
        {chartData.length > 0 && (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit=" ms" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
                <Legend />
                <Bar dataKey="totalLatency" name="Total Round-Trip (ms)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ttfb" name="Estimated TTFB (ms)" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Real Measurement Metrics Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin Result */}
          <div className="p-4 rounded-xl bg-vault-850/60 border border-vault-800 space-y-2 text-xs font-mono">
            <div className="text-vault-500 flex items-center justify-between border-b border-vault-800 pb-2">
              <span className="font-semibold text-vault-100 flex items-center gap-1.5 font-sans">
                <Server className="w-4 h-4 text-vault-500" /> Origin Server
              </span>
              <span>{originResult ? `${originResult.durationMs} ms` : 'Not run'}</span>
            </div>
            {originResult ? (
              <div className="space-y-1 text-vault-400">
                <div>HTTP Status: <span className="text-emerald-400 font-bold">{originResult.status}</span></div>
                <div>Target: <span className="text-vault-500 truncate">{originResult.url}</span></div>
                <div>Server Header: <span className="text-vault-400">SecureVault-Origin-Node</span></div>
                <div>Measured At: <span>{originResult.timestamp}</span></div>
              </div>
            ) : (
              <p className="text-vault-600 py-2">Click &apos;Run Latency Test&apos; to measure origin latency.</p>
            )}
          </div>

          {/* CDN Result */}
          <div className="p-4 rounded-xl bg-vault-850/60 border border-vault-800 space-y-2 text-xs font-mono">
            <div className="text-vault-500 flex items-center justify-between border-b border-vault-800 pb-2">
              <span className="font-semibold text-vault-100 flex items-center gap-1.5 font-sans">
                <Globe2 className="w-4 h-4 text-vault-400" /> CloudFront CDN Edge
              </span>
              <span>{cdnResult ? `${cdnResult.durationMs} ms` : 'Not tested'}</span>
            </div>
            {cdnResult ? (
              <div className="space-y-1 text-vault-400">
                <div>HTTP Status: <span className="text-emerald-400 font-bold">{cdnResult.status}</span></div>
                <div>X-Cache Header: <span className="text-vault-bronze">{cdnResult.xCacheHeader || 'N/A'}</span></div>
                <div>Age Header: <span className="text-vault-400">{cdnResult.ageHeader || '0'}s</span></div>
                <div>Measured At: <span>{cdnResult.timestamp}</span></div>
              </div>
            ) : (
              <p className="text-vault-600 py-2">
                {customCdnDomain
                  ? 'Click Run Latency Test to measure edge distribution.'
                  : 'Enter a valid CloudFront distribution domain above to measure live edge latency.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CloudFront Setup Checklist if not yet configured */}
      {!cloudStatus?.cloudFrontConfigured && (
        <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
          <h3 className="text-base font-semibold text-vault-100">CloudFront CDN Deployment Checklist</h3>
          <p className="text-xs text-vault-500">
            Follow these verified steps to deploy the static frontend to a private S3 origin with CloudFront:
          </p>

          <div className="space-y-3">
            {[
              {
                step: '1. Build Static Frontend Bundle',
                desc: 'Run `npm run build` to generate the optimized production assets in client/dist.',
              },
              {
                step: '2. Create Website S3 Bucket (Private)',
                desc: 'Keep bucket public access BLOCKED. Website hosting will be mediated strictly through CloudFront.',
              },
              {
                step: '3. Create CloudFront Origin Access Control (OAC)',
                desc: 'Configure OAC type `s3` so only CloudFront signing can read the website bucket objects.',
              },
              {
                step: '4. Update S3 Bucket Policy with CloudFront Condition',
                desc: 'Allow `s3:GetObject` with condition `AWS:SourceArn: arn:aws:cloudfront::ACCOUNT:distribution/DIST_ID`.',
              },
              {
                step: '5. Invalidate CloudFront Cache',
                desc: 'Trigger `aws cloudfront create-invalidation --paths "/*"` to immediately refresh global edge caches.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-vault-850/70 border border-vault-800 text-xs">
                <div className="font-semibold text-vault-100">{item.step}</div>
                <div className="text-vault-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
