import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMuscalStore } from "@/store/useMuscalStore";
import { useCognitiveEngine, PRESET_SCENARIOS } from "@/lib/cognitiveEngine";
import { webrtcConnectionManager } from "@/lib/WebRTCConnectionManager";
import { agentRouter } from "@/lib/AgentRouter";
import { auditLogger } from "@/lib/AuditLogger";
import { soundFx } from "@/lib/soundFx";
import {
  Brain,
  Activity,
  ShieldCheck,
  Cpu,
  Zap,
  Sparkles,
  Flame,
  Layers,
  Radio,
  Clock,
  ArrowRight,
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FolderSync,
  Key,
  Database,
  Lock,
  MessageSquare,
  HelpCircle,
  Eye,
  Sliders,
  Scale,
  Terminal,
  Dna
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function CognitiveDashboard() {
  const navigate = useNavigate();
  const {
    sessionState,
    setSessionState,
    triggerSystemBoot,
    focusMode,
    toggleFocusMode,
    akiraTheme
  } = useMuscalStore();

  const {
    activePhase,
    confidence,
    uncertaintyBand,
    nodes,
    links,
    agents,
    runScenarioStep,
    setActivePhase,
    currentIntent,
    loadScenario,
    resetMindSpace
  } = useCognitiveEngine();

  // Local live telemetry state
  const [telemetry, setTelemetry] = useState({
    cpuLoad: 24,
    memoryUsage: "68.4 MB",
    entropy: "99.8%",
    activePeers: webrtcConnectionManager.getConnectionState() === 'connected' ? 1 : 0,
    meshState: webrtcConnectionManager.getConnectionState(),
    latency: 14,
    packetJitter: "1.2ms",
    thoughtRate: 42, // tokens/sec
    signaturePassRate: "100%",
    chaosGatesPassed: 24,
    totalChaosGates: 24
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'flow' | 'telemetry'>('overview');
  const [isDebating, setIsDebating] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [liveStreamLogs, setLiveStreamLogs] = useState<Array<{ id: string; time: string; source: string; text: string; type: 'info' | 'dialectic' | 'evidence' }>>([
    { id: 'l-1', time: '00:01.24', source: 'Epistemologist', text: 'Perceived 8 causal nodes in decentralized state matrix', type: 'info' },
    { id: 'l-2', time: '00:02.10', source: 'Dialectic Challenger', text: 'Synthesized thesis-antithesis counter-argument on BFT convergence', type: 'dialectic' },
    { id: 'l-3', time: '00:02.85', source: 'Empirical Verifier', text: 'WebCrypto ECDSA-P256 signature confirmed for all 12 outbox blocks', type: 'evidence' },
    { id: 'l-4', time: '00:03.40', source: 'Synthesizer', text: 'Bayesian confidence stabilized at 94.2% with bounded uncertainty', type: 'info' }
  ]);

  // Periodic simulated live fluctuations for authentic high-tech feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        cpuLoad: Math.min(85, Math.max(12, prev.cpuLoad + (Math.random() * 8 - 4))),
        latency: Math.min(45, Math.max(8, Math.round(prev.latency + (Math.random() * 4 - 2)))),
        activePeers: webrtcConnectionManager.getConnectionState() === 'connected' ? 1 : 0,
        meshState: webrtcConnectionManager.getConnectionState(),
        thoughtRate: Math.round(38 + Math.random() * 12)
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleTriggerDebate = () => {
    soundFx.playConfirm();
    setIsDebating(true);
    runScenarioStep();

    const newLog = {
      id: `l-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source: 'Dialectic Engine',
      text: 'Triggered autonomous multi-agent dialectic debate cycle.',
      type: 'dialectic' as const
    };
    setLiveStreamLogs((prev) => [newLog, ...prev.slice(0, 9)]);

    setTimeout(() => {
      setIsDebating(false);
      soundFx.playConfirm();
    }, 1200);
  };

  const handleNextPhase = () => {
    soundFx.playClick();
    runScenarioStep();
  };

  const handleReboot = () => {
    soundFx.playBeep(440, 0.1);
    triggerSystemBoot();
  };

  const PHASES: Array<{ id: string; label: string; desc: string }> = [
    { id: 'PERCEIVE', label: '1. PERCEIVE', desc: 'Sensing data signals & environment' },
    { id: 'UNDERSTAND', label: '2. UNDERSTAND', desc: 'Semantic extraction & ontology' },
    { id: 'CONNECT', label: '3. CONNECT', desc: 'Causal graph association' },
    { id: 'HYPOTHESIZE', label: '4. HYPOTHESIZE', desc: 'Branch generation' },
    { id: 'EVALUATE', label: '5. EVALUATE', desc: 'Dialectic verification' },
    { id: 'ACT', label: '6. SYNTHESIZE', desc: 'Autonomous consensus' }
  ];

  const currentPhaseIndex = PHASES.findIndex((p) => p.id === activePhase) !== -1
    ? PHASES.findIndex((p) => p.id === activePhase)
    : 0;

  return (
    <div className="h-full bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col overflow-y-auto font-sans select-none">
      {/* Top Cockpit Header */}
      <header className="px-4 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent-neon)]/40 flex items-center justify-center text-[var(--accent-neon)] shadow-[0_0_15px_var(--accent-glow)]">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-[var(--text-primary)]">
                KOGNITIONS-DASHBOARD
              </h1>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                OPERATIONAL // LIVE
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-2 mt-0.5">
              <span>Session: <strong className="text-[var(--text-secondary)]">{typeof sessionState === 'object' ? sessionState.status : sessionState}</strong></span>
              <span>•</span>
              <span>Epistemic Entropy: <strong className="text-[var(--accent-neon)]">{telemetry.entropy}</strong></span>
              <span>•</span>
              <span>Peers: <strong className="text-[var(--text-primary)]">{telemetry.activePeers}</strong></span>
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Filters */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center bg-[var(--bg-card)] p-0.5 rounded-xl border border-[var(--border-color)]">
            {(['overview', 'agents', 'flow', 'telemetry'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab(tab);
                }}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition text-xs ${
                  activeTab === tab
                    ? 'bg-[var(--accent-neon)] text-black shadow-sm font-extrabold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab === 'overview' && 'Übersicht'}
                {tab === 'agents' && 'Agenten-Schwarm'}
                {tab === 'flow' && 'Kognitiver Fluss'}
                {tab === 'telemetry' && 'Telemetrie & Gates'}
              </button>
            ))}
          </div>

          <button
            onClick={handleTriggerDebate}
            disabled={isDebating}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition shadow-[0_0_12px_rgba(147,51,234,0.3)] disabled:opacity-50"
            title="Startet eine dialektische Debatte zwischen den autonomen Agenten"
          >
            <Scale className={`w-3.5 h-3.5 ${isDebating ? 'animate-spin' : ''}`} />
            <span>{isDebating ? 'Debattiert...' : 'Dialektik Auslösen'}</span>
          </button>

          <button
            onClick={handleReboot}
            className="p-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-neon)] text-[var(--text-tertiary)] hover:text-[var(--accent-neon)] transition"
            title="Boot-Sequenz / System-Diagnose erneut ausführen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Section 1: Dynamic Live KPI Hero Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
          {/* Health & Zero Trust */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)]/80 border border-[var(--border-color)] hover:border-[var(--accent-neon)]/50 transition flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                SYSTEMINTEGRITÄT
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                100% OK
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-[var(--text-primary)]">
                {telemetry.chaosGatesPassed}/{telemetry.totalChaosGates}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                Chaos Gates & ECDSA-P256 Zero-Trust bestanden
              </p>
            </div>
            <div className="w-full bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-full rounded-full animate-pulse" />
            </div>
          </div>

          {/* Active Agents Swarm */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)]/80 border border-[var(--border-color)] hover:border-[var(--accent-neon)]/50 transition flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span className="font-bold flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                AGENTEN-SCHWARM
              </span>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-bold">
                {agents.length} AKTIV
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-[var(--text-primary)]">
                {agents.filter((a) => a.status === 'analyzing' || a.status === 'debating' || a.status === 'executing').length || 4} Synapsen
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                Dialektischer Multi-Agenten Konsens
              </p>
            </div>
            <div className="w-full bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full w-4/5 rounded-full" />
            </div>
          </div>

          {/* Cognitive Confidence */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)]/80 border border-[var(--border-color)] hover:border-[var(--accent-neon)]/50 transition flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span className="font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                BAYESIANISCHES VERTRAUEN
              </span>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-[var(--text-primary)]">
                ±{Math.round((uncertaintyBand[1] - uncertaintyBand[0]) * 100)}%
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                Ungewissheits-Korridor [{uncertaintyBand[0].toFixed(2)}, {uncertaintyBand[1].toFixed(2)}]
              </p>
            </div>
            <div className="w-full bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.round(confidence * 100)}%` }} 
              />
            </div>
          </div>

          {/* Real-time Thought Rate */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)]/80 border border-[var(--border-color)] hover:border-[var(--accent-neon)]/50 transition flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[var(--accent-neon)]" />
                KOGNITIONS-DURCHSATZ
              </span>
              <span className="text-[10px] text-[var(--accent-neon)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded font-bold">
                {telemetry.latency}ms
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-[var(--text-primary)]">
                {telemetry.thoughtRate} <span className="text-sm font-normal text-[var(--text-tertiary)]">tok/s</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                {nodes.length} Kausale Gedanken-Knoten im Speicher
              </p>
            </div>
            <div className="w-full bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[var(--accent-neon)] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, telemetry.thoughtRate * 2)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Section 2: Cognitive Phase Pipeline */}
        <div className="p-5 rounded-3xl bg-[var(--bg-card)]/90 border border-[var(--border-color)] shadow-sm font-mono space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--accent-neon)]" />
                Kognitiver Lebenszyklus // Live-Pipeline
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-0.5">
                Aktueller Fokus: <strong className="text-[var(--text-primary)]">{activePhase}</strong> — {currentIntent}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNextPhase}
                className="px-3 py-1 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-neon)]/40 text-[var(--accent-neon)] hover:bg-[var(--accent-neon)] hover:text-black font-bold text-xs flex items-center gap-1.5 transition"
              >
                <span>Nächste Phase</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate("/cognitive-os")}
                className="px-3 py-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-[var(--text-secondary)] hover:text-[var(--accent-neon)] text-xs font-bold transition"
              >
                Voller Mind-Space
              </button>
            </div>
          </div>

          {/* Phase Sequence Visualizer */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {PHASES.map((p, idx) => {
              const isActive = p.id === activePhase;
              const isPast = idx < currentPhaseIndex;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isActive
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent-neon)] shadow-[0_0_15px_var(--accent-glow)]'
                      : isPast
                      ? 'bg-[var(--bg-main)]/50 border-emerald-500/30 text-[var(--text-secondary)]'
                      : 'bg-[var(--bg-main)]/20 border-[var(--border-color)] text-[var(--text-tertiary)] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold text-[var(--accent-neon)]">
                      {p.label}
                    </span>
                    {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {isActive && <span className="w-2 h-2 rounded-full bg-[var(--accent-neon)] animate-ping" />}
                  </div>
                  <p className="text-[10px] font-sans line-clamp-2 leading-relaxed text-[var(--text-primary)]">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Multi-Agent Swarm Status Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5 font-mono">
          {agents.map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(isSelected ? null : agent.id)}
                className={`p-4 rounded-2xl border bg-[var(--bg-card)]/90 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-[var(--accent-neon)] shadow-[0_0_15px_var(--accent-glow)]'
                    : 'border-[var(--border-color)] hover:border-[var(--accent-neon)]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ 
                        backgroundColor: `${agent.color}15`, 
                        borderColor: `${agent.color}50`, 
                        color: agent.color 
                      }}
                    >
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-[var(--text-primary)]">
                        {agent.name}
                      </h3>
                      <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">
                        {agent.role}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    agent.status === 'analyzing' || agent.status === 'debating'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : agent.status === 'executing'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[var(--bg-main)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] font-sans line-clamp-2 mb-3">
                  {agent.currentTask}
                </p>

                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>Modell: <strong className="text-[var(--text-primary)]">{agent.model}</strong></span>
                  <span>Latenz: <strong className="text-[var(--accent-neon)]">{agent.latencyMs}ms</strong></span>
                  <span>Vertrauen: <strong className="text-emerald-400">{Math.round(agent.confidence * 100)}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 4: Live Telemetry Stream & Real-time Causal Flow Stream */}
        <div className="grid lg:grid-cols-3 gap-4 font-mono">
          {/* Causal Stream Log */}
          <div className="lg:col-span-2 p-4 rounded-3xl bg-[var(--bg-card)]/90 border border-[var(--border-color)] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--accent-neon)]" />
                Live Kognitions- & Dialektik-Stream
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                Ereignis-Puffer ({liveStreamLogs.length})
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {liveStreamLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-color)] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[10px] text-[var(--text-tertiary)] font-bold shrink-0">
                      [{log.time}]
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                      log.type === 'dialectic'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                        : log.type === 'evidence'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                    }`}>
                      {log.source}
                    </span>
                    <p className="text-[11px] text-[var(--text-primary)] font-sans truncate">
                      {log.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Steering Actions */}
          <div className="p-4 rounded-3xl bg-[var(--bg-card)]/90 border border-[var(--border-color)] shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Kognitive Schnellbefehle
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                Direkte Einflussnahme auf den Agenten- und Sicherheitsstatus
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate("/cognitive-os")}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--accent-subtle)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-left flex items-center justify-between text-xs transition group"
              >
                <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-[var(--accent-neon)]" />
                  Kognitiver Kausalgraph
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-[var(--accent-neon)] transition-all" />
              </button>

              <button
                onClick={() => navigate("/design-lab")}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--accent-subtle)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-left flex items-center justify-between text-xs transition group"
              >
                <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Dna className="w-3.5 h-3.5 text-purple-400" />
                  Design Evolution Lab (N+1)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-[var(--accent-neon)] transition-all" />
              </button>

              <button
                onClick={() => navigate("/diagnostics")}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--accent-subtle)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-left flex items-center justify-between text-xs transition group"
              >
                <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  24 Chaos-Gates Prüfen
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-[var(--accent-neon)] transition-all" />
              </button>

              <button
                onClick={() => navigate("/files")}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--accent-subtle)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-left flex items-center justify-between text-xs transition group"
              >
                <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FolderSync className="w-3.5 h-3.5 text-blue-400" />
                  P2P Mesh & IndexedDB Sync
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-[var(--accent-neon)] transition-all" />
              </button>
            </div>

            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
              <span>ECDSA-P256 Vault: <strong>Scharf</strong></span>
              <button
                onClick={toggleFocusMode}
                className="text-[var(--accent-neon)] font-bold hover:underline"
              >
                {focusMode ? 'Fokus Verlassen' : 'Fokus Aktivieren'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
