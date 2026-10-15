import React, { useState } from 'react';
import { Globe2, Server, Zap, Radio, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface EdgeNode {
  id: string;
  name: string;
  region: string;
  coords: { x: number; y: number }; // Percentage on map canvas
  latencyEst: number;
  status: 'active' | 'probing' | 'idle';
}

const EDGE_NODES: EdgeNode[] = [
  { id: 'us-east', name: 'US East (N. Virginia)', region: 'us-east-1', coords: { x: 26, y: 35 }, latencyEst: 18, status: 'active' },
  { id: 'us-west', name: 'US West (Oregon)', region: 'us-west-2', coords: { x: 18, y: 32 }, latencyEst: 28, status: 'active' },
  { id: 'eu-central', name: 'Europe (Frankfurt)', region: 'eu-central-1', coords: { x: 52, y: 30 }, latencyEst: 22, status: 'active' },
  { id: 'eu-west', name: 'Europe (London)', region: 'eu-west-2', coords: { x: 48, y: 28 }, latencyEst: 20, status: 'active' },
  { id: 'ap-south', name: 'Asia Pacific (Mumbai)', region: 'ap-south-1', coords: { x: 68, y: 46 }, latencyEst: 14, status: 'active' },
  { id: 'ap-southeast', name: 'Asia Pacific (Singapore)', region: 'ap-southeast-1', coords: { x: 76, y: 56 }, latencyEst: 24, status: 'active' },
  { id: 'ap-northeast', name: 'Asia Pacific (Tokyo)', region: 'ap-northeast-1', coords: { x: 84, y: 36 }, latencyEst: 32, status: 'active' },
  { id: 'ap-southeast-2', name: 'Australia (Sydney)', region: 'ap-southeast-2', coords: { x: 88, y: 78 }, latencyEst: 38, status: 'active' },
  { id: 'sa-east', name: 'South America (São Paulo)', region: 'sa-east-1', coords: { x: 34, y: 72 }, latencyEst: 45, status: 'active' },
];

export const CdnEdgeMap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<EdgeNode>(EDGE_NODES[0]);
  const [probingNodeId, setProbingNodeId] = useState<string | null>(null);
  const [probedLatency, setProbedLatency] = useState<number | null>(null);

  const handleProbe = (node: EdgeNode) => {
    setSelectedNode(node);
    setProbingNodeId(node.id);
    setProbedLatency(null);

    // Simulate realistic edge ping probe with slight variance
    setTimeout(() => {
      const variance = Math.floor(Math.random() * 8) - 4;
      const finalLatency = Math.max(8, node.latencyEst + variance);
      setProbedLatency(finalLatency);
      setProbingNodeId(null);
    }, 400);
  };

  return (
    <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-6 relative overflow-hidden backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-vault-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-vault-400" />
            <h3 className="text-base font-semibold text-vault-100">CloudFront Global Edge POP Topology</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-vault-bronze/10 text-vault-400 border border-vault-700/50">
              600+ Points of Presence
            </span>
          </div>
          <p className="text-xs text-vault-500 mt-1">
            Click any edge node to execute live cryptographic edge-routing probe with SigV4 Origin Access Control
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Edge Online
          </span>
          <span className="text-vault-700">|</span>
          <span className="text-vault-400">OAC Protected</span>
        </div>
      </div>

      {/* Stylized World Map Canvas */}
      <div className="relative w-full h-80 rounded-xl bg-vault-950/90 border border-vault-800 overflow-hidden flex items-center justify-center">
        {/* Subtle grid background lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Global continent silhouettes (Stylized SVG) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 1000 500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          {/* North America */}
          <path d="M150,100 Q220,120 280,180 T260,250 T220,290 T140,240 T120,150 Z" style={{ color: '#d4904e' }} fill="currentColor" fillOpacity="0.12" />
          {/* South America */}
          <path d="M280,280 Q340,320 320,420 T260,460 T250,350 Z" style={{ color: '#c97c35' }} fill="currentColor" fillOpacity="0.12" />
          {/* Europe */}
          <path d="M480,120 Q560,110 570,180 T520,220 T460,170 Z" style={{ color: '#d4904e' }} fill="currentColor" fillOpacity="0.12" />
          {/* Africa */}
          <path d="M480,220 Q560,250 540,380 T470,390 T450,260 Z" style={{ color: '#b56528' }} fill="currentColor" fillOpacity="0.12" />
          {/* Asia */}
          <path d="M600,120 Q780,100 850,220 T780,320 T620,260 Z" style={{ color: '#e8924c' }} fill="currentColor" fillOpacity="0.12" />
          {/* Australia */}
          <path d="M820,360 Q900,380 880,450 T810,440 Z" style={{ color: '#10b981' }} fill="currentColor" fillOpacity="0.12" />
        </svg>

        {/* Origin Server Icon (Pinned at US-East S3) */}
        <div
          className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
          style={{ left: `26%`, top: `35%` }}
        >
          <div className="w-5 h-5 rounded-full bg-vault-600 border-2 border-white flex items-center justify-center shadow-glow-violet animate-pulse">
            <Server className="w-3 h-3 text-vault-100" />
          </div>
          <span className="text-[10px] font-mono text-vault-400 font-bold bg-vault-950/80 px-1 rounded mt-1 border border-vault-600/40">
            S3 Origin
          </span>
        </div>

        {/* Edge POP Nodes */}
        {EDGE_NODES.map((node) => {
          const isSelected = selectedNode.id === node.id;
          const isProbing = probingNodeId === node.id;

          return (
            <button
              key={node.id}
              onClick={() => handleProbe(node)}
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
              style={{ left: `${node.coords.x}%`, top: `${node.coords.y}%` }}
              title={`${node.name} - Click to test latency`}
            >
              {/* Ping Wave */}
              <div className="absolute -inset-2 rounded-full border border-vault-accent animate-radar opacity-60" />

              {/* Node Dot */}
              <div
                className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                  isSelected
                    ? 'border-white scale-125'
                    : 'bg-vault-850 border-vault-accent hover:scale-125'
                }`}
                style={isSelected ? { background: '#d4904e', boxShadow: '0 0 12px rgba(212,144,78,0.7)' } : {}}
              >
                <div className={`w-1.5 h-1.5 rounded-full`}
                  style={{ background: isSelected ? '#0d0906' : '#d4904e' }}
                />
              </div>

              {/* Node Tooltip Label on Hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-vault-900 border border-vault-700 text-[10px] font-mono text-vault-100 whitespace-nowrap shadow-xl pointer-events-none z-30">
                {node.name} &bull; ~{node.latencyEst}ms
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Edge POP Diagnostics Panel */}
      <div className="p-4 rounded-xl bg-vault-850/70 border border-vault-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-vault-500">Selected CloudFront Edge:</span>
            <span className="text-vault-100 font-bold text-sm font-sans">{selectedNode.name}</span>
            <span className="text-vault-bronze">({selectedNode.region})</span>
          </div>
          <div className="text-vault-500 text-[11px] flex items-center gap-3">
            <span>Protocol: HTTPS/2 &amp; TLS 1.3</span>
            <span>&bull;</span>
            <span>Origin: Private S3 (AWS:SourceArn SigV4)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-vault-500 text-[11px] block">Edge Latency</span>
            <span className="text-vault-400 font-bold text-base">
              {probingNodeId === selectedNode.id ? (
                <span className="animate-pulse">Probing...</span>
              ) : probedLatency ? (
                `${probedLatency} ms`
              ) : (
                `~${selectedNode.latencyEst} ms`
              )}
            </span>
          </div>

          <button
            onClick={() => handleProbe(selectedNode)}
            className="px-3.5 py-2 rounded-xl bg-vault-accent hover:bg-vault-copper text-vault-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" /> Probe Edge
          </button>
        </div>
      </div>
    </div>
  );
};
