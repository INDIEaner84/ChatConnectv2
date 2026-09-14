import { useState } from "react";
import { motion } from "motion/react";
import { HardDrive, Database, Activity, Plus, Layers, Network, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KnowledgeSources } from "@/components/KnowledgeSources";
import { KnowledgeBaseManager } from "@/components/KnowledgeBaseManager";

export function Knowledge() {
  const [activeTab, setActiveTab] = useState<"manager" | "sources">("manager");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 text-[var(--text-primary)] transition-colors h-full overflow-y-auto relative z-10"
    >
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-neon)] via-purple-400 to-indigo-400">
            LFM RAG & Knowledge Base
          </h1>
          <p className="text-[var(--text-tertiary)] mt-1.5 font-mono text-xs md:text-sm tracking-wide">
            {">"} MULTI-VECTOR COLBERT RETRIEVAL, EMBEDDINGS & DECENTRALIZED KNOWLEDGE GRAPH.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
          <button
            onClick={() => setActiveTab("manager")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 ${
              activeTab === "manager"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ColBERT RAG Manager</span>
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 ${
              activeTab === "sources"
                ? "bg-[var(--accent-neon)] text-black shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Connected Sources</span>
          </button>
        </div>
      </header>

      {/* Primary Section */}
      {activeTab === "manager" ? (
        <KnowledgeBaseManager />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: "Total Vectors", value: "2,459,201", icon: Database, color: "var(--accent-neon)" },
              { label: "Total Documents", value: "9,989", icon: HardDrive, color: "var(--accent-emerald)" },
              { label: "Sync Health", value: "85%", icon: Activity, color: "var(--text-secondary)" }
            ].map((stat, i) => (
              <div key={i} className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-[var(--bg-sidebar)]/60 border border-[var(--border-color)] rounded-xl">
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{stat.label}</div>
                    <div className="text-xl font-black font-mono tracking-tight mt-0.5">{stat.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2">
              <Database className="w-3.5 h-3.5" /> Connected External Storage Sources
            </h2>
            <KnowledgeSources />
          </div>
        </div>
      )}
    </motion.div>
  );
}
