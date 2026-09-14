import { useMuscalStore } from "@/store/useMuscalStore";
import { Activity, Clock, Server, Cloud, Cpu, CheckCircle2, XCircle, Zap } from "lucide-react";
import { motion } from "motion/react";
import { OrchestrationGraph } from "@/components/OrchestrationGraph";

export function Trace() {
  const { trace } = useMuscalStore();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 text-[var(--text-primary)] transition-colors h-full overflow-y-auto relative">
      {/* Background Cyber-Grid Effect */}
      <div className="absolute inset-0 pointer-events-none" style={{ 
        backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)', 
        backgroundSize: '32px 32px',
        opacity: 0.3
      }}></div>

      <header className="flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-emerald)] to-[var(--accent-neon)]">
            Execution Trace
          </h1>
          <p className="text-[var(--text-tertiary)] mt-2 font-mono text-sm tracking-wide">
            {">"} LIVE TIMELINE OF AI INTENT, PLANNING, AND TOOL EXECUTION.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-sidebar)] p-3 rounded-lg border border-[var(--border-color)] shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <div className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-500" /> LOCAL</div>
          <div className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-blue-500" /> SERVER</div>
          <div className="flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5 text-indigo-500" /> CLOUD</div>
        </div>
      </header>

      <div className="relative z-10">
        <OrchestrationGraph />
      </div>

      <div className="space-y-6 relative z-10">
        {trace.length === 0 ? (
          <div className="p-16 text-center text-[var(--text-tertiary)] border border-[var(--border-color)] border-dashed rounded-2xl bg-[var(--bg-card)]/50 backdrop-blur-sm">
            <Zap className="w-10 h-10 mx-auto mb-4 opacity-50 text-emerald-500 animate-pulse" />
            <p className="font-mono text-sm uppercase tracking-widest">Awaiting Telemetry</p>
            <p className="text-xs mt-2 opacity-70">Interact with MUSCAL to initiate execution traces.</p>
          </div>
        ) : (
          trace.map((entry, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ delay: index * 0.15, duration: 0.4, ease: "easeOut" }}
              key={entry.id} 
              className="relative pl-10 pb-8"
            >
              {/* Glowing Cyber-Timeline line */}
              {index !== trace.length - 1 && (
                <div className="absolute left-[15px] top-10 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500/50 via-cyan-500/20 to-transparent" />
              )}
              
              {/* Glowing Node */}
              <div className="absolute left-0 top-2 w-8 h-8 rounded-md bg-[var(--bg-card)] border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center justify-center rotate-45 overflow-hidden">
                <div className="-rotate-45 relative z-10">
                  {entry.layer === 'CLOUD' ? <Cloud className="w-4 h-4 text-indigo-400" /> : entry.layer === 'SERVER' ? <Server className="w-4 h-4 text-blue-400" /> : <Cpu className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />
              </div>

              {/* Holographic Card */}
              <div className="bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] border-l-4 border-l-emerald-500 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] hover:border-[var(--border-color)] hover:border-l-cyan-400 transition-all duration-300">
                <div className="flex justify-between items-start mb-6 border-b border-[var(--border-color)]/50 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg tracking-tight">{entry.intent}</span>
                    <span className="text-[10px] bg-[var(--bg-active)] border border-[var(--border-color)] text-emerald-500 px-2.5 py-1 rounded-md font-mono tracking-wider shadow-inner">
                      {entry.model}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)] font-mono bg-[var(--bg-sidebar)] px-3 py-1.5 rounded-full border border-[var(--border-color)]">
                    <Clock className="w-3 h-3 text-cyan-500" />
                    {entry.latency}ms
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-4">
                    <div className="group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-150 transition-transform" />
                        <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest font-mono">Plan</div>
                      </div>
                      <div className="text-[var(--text-secondary)] bg-[var(--bg-main)]/50 border border-[var(--border-color)]/50 p-3.5 rounded-lg font-mono text-xs leading-relaxed">
                        {entry.plan}
                      </div>
                    </div>
                    <div className="group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full group-hover:scale-150 transition-transform" />
                        <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest font-mono">Action <span className="opacity-50">(Tool: {entry.tool})</span></div>
                      </div>
                      <div className="text-[var(--text-primary)] bg-[var(--bg-sidebar)] border border-emerald-500/20 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)] p-3.5 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        {entry.action}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full group-hover:scale-150 transition-transform" />
                        <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest font-mono">Observation</div>
                      </div>
                      <div className="text-[var(--text-secondary)] bg-[var(--bg-main)]/50 border border-[var(--border-color)]/50 p-3.5 rounded-lg font-mono text-xs leading-relaxed">
                        {entry.observation}
                      </div>
                    </div>
                    <div className="group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full group-hover:scale-150 transition-transform ${entry.result === 'Success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest font-mono">Verification</div>
                      </div>
                      <div className={`flex items-start gap-3 p-3.5 rounded-lg border ${entry.result === 'Success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                        {entry.result === 'Success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                        <div>
                          <div className="font-bold text-xs uppercase tracking-wide">{entry.result}</div>
                          <div className="text-[10px] opacity-80 mt-1 font-mono">{entry.verification}</div>
                          {entry.error && <div className="text-[10px] font-mono mt-2 bg-red-500/10 p-2 rounded border border-red-500/20">{entry.error}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
