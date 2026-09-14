import React from "react";
import { Brain, Database, Wrench, MessageSquare, ArrowRight, Zap, RefreshCw, Cpu } from "lucide-react";
import { motion } from "motion/react";

interface NodeProps {
  key?: string;
  icon: React.ElementType;
  label: string;
  subtext: string;
  active?: boolean;
  x: number;
  y: number;
}

function GraphNode({ icon: Icon, label, subtext, active, x, y }: NodeProps) {
  return (
    <div 
      className={`absolute flex flex-col items-center justify-center w-32 h-32 -ml-16 -mt-16 rounded-2xl border transition-all duration-500 z-10 ${
        active 
          ? "bg-[var(--bg-active)] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
          : "bg-[var(--bg-card)] border-[var(--border-color)] opacity-80"
      }`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`p-3 rounded-xl mb-2 transition-colors ${active ? "bg-emerald-500/10 text-emerald-500" : "bg-[var(--bg-sidebar)] text-[var(--text-secondary)]"}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className={`text-xs font-bold text-center ${active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{label}</div>
      <div className="text-[10px] text-[var(--text-tertiary)] text-center mt-1 font-mono uppercase tracking-wider">{subtext}</div>
    </div>
  );
}

export function Agents() {
  // Hardcoded positions for the LLM Orchestration DAG
  const nodes = [
    { id: 'user', icon: MessageSquare, label: 'User Input', subtext: 'Query', x: 15, y: 50, active: true },
    { id: 'router', icon: Brain, label: 'Intent Router', subtext: 'Classifier', x: 35, y: 50, active: true },
    { id: 'memory', icon: Database, label: 'Context Engine', subtext: 'Vector DB', x: 55, y: 25, active: false },
    { id: 'tools', icon: Wrench, label: 'Tool Executor', subtext: 'WebRTC / Files', x: 55, y: 75, active: true },
    { id: 'synth', icon: Cpu, label: 'Synthesizer', subtext: 'Generator', x: 75, y: 50, active: true },
    { id: 'output', icon: Zap, label: 'Response', subtext: 'Output', x: 92, y: 50, active: true },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-8 max-w-6xl mx-auto space-y-8 text-[var(--text-primary)] transition-colors h-full overflow-y-auto"
    >
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LLM Orchestration</h1>
          <p className="text-[var(--text-tertiary)] mt-1">Live visualization of the multi-agent inference graph and tool execution flow.</p>
        </div>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1"><RefreshCw className="w-3 h-3 text-emerald-500 animate-spin-slow" /> ACTIVE INFERENCE</div>
        </div>
      </header>

      <div className="relative w-full h-[600px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm mt-8">
        {/* Background Grid */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)', 
          backgroundSize: '24px 24px',
          opacity: 0.4
        }}></div>

        {/* Connecting Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--border-color)" />
            </marker>
            <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#10B981" />
            </marker>
          </defs>

          {/* User -> Router */}
          <path d="M 15% 50% L 35% 50%" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrowhead-active)" className="animate-pulse" />
          
          {/* Router -> Memory */}
          <path d="M 35% 50% Q 35% 25% 55% 25%" stroke="var(--border-color)" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
          
          {/* Router -> Tools */}
          <path d="M 35% 50% Q 35% 75% 55% 75%" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrowhead-active)" className="animate-pulse" />
          
          {/* Memory -> Synth */}
          <path d="M 55% 25% Q 75% 25% 75% 50%" stroke="var(--border-color)" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
          
          {/* Tools -> Synth */}
          <path d="M 55% 75% Q 75% 75% 75% 50%" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrowhead-active)" className="animate-pulse" />
          
          {/* Synth -> Output */}
          <path d="M 75% 50% L 92% 50%" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrowhead-active)" className="animate-pulse" />
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <GraphNode 
            key={node.id}
            icon={node.icon}
            label={node.label}
            subtext={node.subtext}
            x={node.x}
            y={node.y}
            active={node.active}
          />
        ))}

        {/* Overlay Status */}
        <div className="absolute bottom-6 left-6 bg-[var(--bg-sidebar)] border border-[var(--border-color)] px-4 py-3 rounded-lg shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Current Step</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium">Executing Tool: <span className="font-mono text-emerald-600 dark:text-emerald-400">transmitDataChannel()</span></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
