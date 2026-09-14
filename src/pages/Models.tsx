import { useState, useEffect } from "react";
import { agentRouter, RoutingStrategy, ModelRegistryEntry } from "@/lib/AgentRouter";
import { liquidAiHub, LiquidModelPackage } from "@/lib/liquidai/LiquidAiHub";
import { soundFx } from "@/lib/soundFx";
import { 
  Cpu, 
  Server, 
  Cloud, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Sliders, 
  Play, 
  Sparkles, 
  Download, 
  Trash2, 
  HardDrive, 
  Layers, 
  Activity, 
  Radio,
  FileCode,
  Globe,
  Mic,
  ShieldCheck,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Models() {
  const [strategy, setStrategy] = useState<RoutingStrategy>(agentRouter.getStrategy());
  const [testQuery, setTestQuery] = useState("Perform late-interaction ColBERT RAG search on encrypted local documents");
  const [decisionResult, setDecisionResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState<"liquid" | "router">("liquid");
  const [liquidModels, setLiquidModels] = useState<LiquidModelPackage[]>(liquidAiHub.getModels());
  const models = agentRouter.getRegistry();

  useEffect(() => {
    const unsubscribe = liquidAiHub.subscribe(() => {
      setLiquidModels([...liquidAiHub.getModels()]);
    });
    return unsubscribe;
  }, []);

  const handleStrategyChange = (newStrat: RoutingStrategy) => {
    agentRouter.setStrategy(newStrat);
    setStrategy(newStrat);
    soundFx.playBeep(980, 0.04);
  };

  const handleDownload = (modelId: string) => {
    soundFx.playModuleActivate();
    liquidAiHub.startModelDownload(modelId);
  };

  const handleToggleActive = (modelId: string) => {
    soundFx.playBeep(1100, 0.04);
    liquidAiHub.toggleModelActive(modelId);
  };

  const handleDelete = (modelId: string) => {
    soundFx.playBeep(600, 0.05);
    liquidAiHub.deleteModel(modelId);
  };

  const runTestInterception = () => {
    setIsEvaluating(true);
    soundFx.playBeep(880, 0.03);
    setTimeout(() => {
      const decision = agentRouter.analyzeAndRoute(testQuery);
      setDecisionResult(decision);
      setIsEvaluating(false);
      soundFx.playSubsystemStabilized();
    }, 220);
  };

  const getLayerIcon = (layer: string) => {
    switch (layer) {
      case "LOCAL": return <Cpu className="w-5 h-5 text-emerald-400" />;
      case "SERVER": return <Server className="w-5 h-5 text-blue-400" />;
      case "CLOUD": return <Cloud className="w-5 h-5 text-indigo-400" />;
      default: return <Cpu className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "audio": return <Mic className="w-5 h-5 text-amber-400" />;
      case "colbert": return <Layers className="w-5 h-5 text-sky-400" />;
      case "embed": return <Zap className="w-5 h-5 text-emerald-400" />;
      case "tool": return <Globe className="w-5 h-5 text-indigo-400" />;
      default: return <Cpu className="w-5 h-5 text-[var(--accent-neon)]" />;
    }
  };

  const getLatencyBadge = (tier: string) => {
    switch (tier) {
      case "ULTRA_LOW":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">&lt; 150ms Edge</span>;
      case "BALANCED":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">~300ms Host</span>;
      case "HIGH_CAPACITY":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">~800ms Cloud</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 text-[var(--text-primary)] transition-colors h-full overflow-y-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-6 h-6 text-[var(--accent-neon)]" />
            <h1 className="text-2xl font-bold tracking-tight">Liquid AI Foundation Models & Neural Hub</h1>
          </div>
          <p className="text-[var(--text-tertiary)] text-xs md:text-sm">
            Download and run Liquid LFM Audio, ColBERT Late-Interaction RAG, Dense Embeddings, and Autonomous Tool Callers directly in your browser.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl self-start">
          <button
            onClick={() => setActiveTab("liquid")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "liquid"
                ? "bg-[var(--accent-neon)] text-black shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Liquid AI Models ({liquidModels.filter(m => m.downloaded).length}/{liquidModels.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("router")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "router"
                ? "bg-[var(--accent-neon)] text-black shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AgentRouter Tiers</span>
          </button>
        </div>
      </header>

      {activeTab === "liquid" ? (
        /* Liquid AI Model Downloader & Hub */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Available Liquid Models", value: `${liquidModels.length}`, sub: "LFM State-Space", icon: Sparkles },
              { label: "Locally Downloaded", value: `${liquidModels.filter(m => m.downloaded).length}`, sub: "Cached in IndexedDB", icon: HardDrive },
              { label: "ColBERT RAG Vectors", value: "1536-dim", sub: "Late-Interaction MaxSim", icon: Layers },
              { label: "Realtime Audio Duplex", value: "<120ms", sub: "Bidirectional Stream", icon: Mic }
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-1">
                <div className="flex items-center justify-between text-[var(--text-tertiary)] text-[10px] font-mono uppercase font-bold">
                  <span>{stat.label}</span>
                  <stat.icon className="w-3.5 h-3.5 text-[var(--accent-neon)]" />
                </div>
                <div className="text-xl font-bold font-mono text-[var(--text-primary)]">{stat.value}</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Downloadable Liquid Foundation Model (LFM) Packages
              </h2>
              <span className="text-xs text-[var(--accent-neon)] font-mono">
                WebAssembly / WebGPU Acceleration Active
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {liquidModels.map((model) => (
                <div
                  key={model.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    model.active
                      ? "border-[var(--accent-neon)]/60 bg-[var(--bg-card)] shadow-[0_0_20px_var(--accent-glow)] ring-1 ring-[var(--accent-neon)]/40"
                      : "border-[var(--border-color)] bg-[var(--bg-card)]/70 hover:border-[var(--border-color)]/80"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                          {getCategoryIcon(model.category)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                            <span>{model.name}</span>
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-[var(--text-tertiary)]">
                            <span>{model.parameters}</span>
                            <span>•</span>
                            <span>{model.architecture}</span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 text-slate-300 border border-slate-500/30">
                        {model.quantization}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {model.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {model.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-color)]/60"
                        >
                          #{cap}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono border-t border-[var(--border-color)]/50">
                      <div>Memory: <strong className="text-[var(--text-primary)]">{model.memoryFootprintMB} MB</strong></div>
                      <div>Throughput: <strong className="text-[var(--accent-neon)]">{model.throughputTokensPerSec} t/s</strong></div>
                    </div>
                  </div>

                  {/* Actions / Download progress */}
                  <div className="mt-5 pt-3 border-t border-[var(--border-color)]/50 flex items-center justify-between gap-3">
                    {model.downloaded ? (
                      <>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className={`w-2 h-2 rounded-full ${model.active ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`} />
                          <span className={model.active ? "text-emerald-400 font-bold" : "text-[var(--text-tertiary)]"}>
                            {model.active ? "Active in Memory" : "Downloaded (Idle)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(model.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                              model.active
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                : "bg-[var(--accent-neon)] text-black hover:opacity-90 shadow-sm"
                            }`}
                          >
                            {model.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDelete(model.id)}
                            title="Delete model from cache"
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : model.downloadProgress > 0 && model.downloadProgress < 100 ? (
                      <div className="w-full space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
                          <span>Downloading weights ({model.fileSize})...</span>
                          <span className="text-[var(--accent-neon)] font-bold">{model.downloadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent-neon)] transition-all duration-300"
                            style={{ width: `${model.downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-mono text-[var(--text-tertiary)]">
                          Size: {model.fileSize}
                        </span>
                        <button
                          onClick={() => handleDownload(model.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold font-mono shadow-sm transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download ({model.fileSize})</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* AgentRouter Layer View */
        <div className="space-y-6">
          {/* Strategy Control Card */}
          <section className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/80 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--accent-neon)]" />
                <h2 className="font-bold text-sm tracking-wide uppercase font-mono">Routing Strategy</h2>
              </div>
              <span className="text-xs font-mono text-[var(--text-tertiary)]">
                Active: <span className="text-[var(--accent-neon)] font-bold">{strategy}</span>
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: "AUTO", label: "AUTO (Adaptive)", desc: "Dynamically classifies intent, tokens, and hardware" },
                { id: "FORCE_LOCAL", label: "FORCE LOCAL", desc: "Always route to LFM edge model (100% on-device)" },
                { id: "FORCE_SERVER", label: "FORCE SERVER", desc: "Always route to Muscal Core node runner" },
                { id: "FORCE_CLOUD", label: "FORCE CLOUD", desc: "Always route to Gemini 2.5 Flash API" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleStrategyChange(item.id as RoutingStrategy)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    strategy === item.id
                      ? "border-[var(--accent-neon)] bg-[var(--accent-neon)]/10 shadow-[0_0_15px_var(--accent-glow)] text-[var(--text-primary)]"
                      : "border-[var(--border-color)]/60 bg-[var(--bg-main)]/50 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs font-mono uppercase tracking-wider mb-1 flex items-center justify-between">
                      {item.label}
                      {strategy === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-neon)]" />}
                    </div>
                    <p className="text-[11px] text-[var(--text-tertiary)] leading-normal">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Model Registry Cards */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Registered Inference Tiers
            </h2>

            <div className="grid md:grid-cols-3 gap-5">
              {models.map((model) => (
                <div 
                  key={model.id}
                  className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/70 backdrop-blur-xl shadow-sm flex flex-col justify-between hover:border-[var(--accent-neon)]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-color)]">
                        {getLayerIcon(model.layer)}
                      </div>
                      {getLatencyBadge(model.latencyTier)}
                    </div>

                    <h3 className="font-bold text-base text-[var(--text-primary)]">{model.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-tertiary)] font-mono">
                      <span>Layer: <strong className="text-[var(--text-primary)]">{model.layer}</strong></span>
                      <span>•</span>
                      <span>Ctx: {(model.contextWindow / 1024).toFixed(0)}k</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {model.capabilities.map((cap) => (
                        <span 
                          key={cap}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-color)]/60"
                        >
                          #{cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border-color)]/50 flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active & Ready
                    </span>
                    <span className="text-[var(--text-tertiary)]">id: {model.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Interception Sandbox */}
          <section className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/80 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-emerald)]" />
              <h2 className="font-bold text-sm tracking-wide uppercase font-mono">Simulate Router Interception</h2>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Input a user prompt to inspect the mathematical intent classification and routing choice made by AgentRouter in real-time.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-neon)]"
                placeholder="Type a sample user query..."
              />
              <button
                onClick={runTestInterception}
                disabled={isEvaluating}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-neon)] hover:bg-[var(--accent-neon)]/90 text-black font-mono font-bold text-xs rounded-xl shadow-[0_0_15px_var(--accent-glow)] transition-all shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Analyze Route
              </button>
            </div>

            {decisionResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-color)]/40 pb-2">
                  <span className="text-[var(--text-tertiary)] uppercase font-bold">Routing Decision</span>
                  <span className="text-[var(--accent-emerald)] font-bold flex items-center gap-1">
                    {getLayerIcon(decisionResult.selectedLayer)}
                    {decisionResult.selectedLayer} ({decisionResult.selectedModel})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div>Confidence: <strong className="text-[var(--text-primary)]">{(decisionResult.confidence * 100).toFixed(0)}%</strong></div>
                  <div>Est. Latency: <strong className="text-[var(--text-primary)]">{decisionResult.estimatedLatencyMs}ms</strong></div>
                  <div>Strategy: <strong className="text-[var(--accent-neon)]">{decisionResult.strategyUsed}</strong></div>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] pt-1 font-sans">
                  <strong>Rationale:</strong> {decisionResult.reason}
                </div>
              </motion.div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

