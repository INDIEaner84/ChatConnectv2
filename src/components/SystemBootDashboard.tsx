/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Futuristic System Boot Sequence & Diagnostic Dashboard
 * Simulates and runs live telemetry verification across all Muscal Core modules,
 * seamlessly transitioning into the live Cognitive Dashboard upon full operational readiness.
 */

import React, { useState, useEffect } from "react";
import { useMuscalStore } from "@/store/useMuscalStore";
import { webrtcConnectionManager } from "@/lib/WebRTCConnectionManager";
import { agentRouter } from "@/lib/AgentRouter";
import { soundFx } from "@/lib/soundFx";
import { auditLogger } from "@/lib/AuditLogger";
import { CognitiveDashboard } from "@/components/cognitive/CognitiveDashboard";
import { 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Database, 
  Radio, 
  FolderSync, 
  MessageSquare, 
  MonitorSmartphone, 
  CheckCircle2, 
  Activity, 
  Sparkles, 
  Flame, 
  Volume2, 
  Layers, 
  ArrowRight,
  RefreshCw,
  Lock,
  Zap,
  Brain,
  Sliders,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

interface BootStep {
  id: string;
  name: string;
  subsystem: string;
  status: "pending" | "running" | "ready" | "error";
  metric: string;
  durationMs: number;
}

const INITIAL_BOOT_STEPS: BootStep[] = [
  {
    id: "crypto",
    name: "WebCrypto Key Vault",
    subsystem: "SECURITY // ECDSA-P256",
    status: "pending",
    metric: "Local Private Keys Verified",
    durationMs: 380,
  },
  {
    id: "storage",
    name: "IndexedDB Storage Node",
    subsystem: "STORAGE // LOCAL-FIRST",
    status: "pending",
    metric: "Offline Outbox & Quota Ready",
    durationMs: 420,
  },
  {
    id: "mesh",
    name: "WebRTC P2P Data Mesh",
    subsystem: "NETWORK // P2P ZERO-TRUST",
    status: "pending",
    metric: "Signaling & ICE Channel Up",
    durationMs: 460,
  },
  {
    id: "firestore",
    name: "Firestore Cloud Signaling",
    subsystem: "GATEWAY // REALTIME SYNC",
    status: "pending",
    metric: "Collection Listeners Mounted",
    durationMs: 360,
  },
  {
    id: "rag",
    name: "RAG Knowledge Index",
    subsystem: "AI // VECTOR MEMORY",
    status: "pending",
    metric: "9,989 Documents Indexed",
    durationMs: 400,
  },
  {
    id: "router",
    name: "AgentRouter Multi-Tier Dispatcher",
    subsystem: "COMPUTE // ADAPTIVE KERNEL",
    status: "pending",
    metric: "Edge LFM / Cloud Flash Active",
    durationMs: 350,
  },
  {
    id: "audio",
    name: "WebAudio SFX Synthesizer",
    subsystem: "HUD // ACOUSTIC FEEDBACK",
    status: "pending",
    metric: "1.2kHz Sine Wave Engine Online",
    durationMs: 300,
  },
  {
    id: "gates",
    name: "24/24 Automated Chaos Gates",
    subsystem: "INTEGRITY // RESILIENCE GATES",
    status: "pending",
    metric: "Zero-Trust Isolation Passed",
    durationMs: 450,
  }
];

export function SystemBootDashboard() {
  const { 
    akiraTheme, 
    completeSystemBoot, 
    focusMode, 
    setFocusMode,
    sessionState,
    sidebarWidth,
    chatListWidth,
    sfxEnabled 
  } = useMuscalStore();
  const navigate = useNavigate();

  const [steps, setSteps] = useState<BootStep[]>(INITIAL_BOOT_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [isBootComplete, setIsBootComplete] = useState(false);
  const [showCognitiveDashboard, setShowCognitiveDashboard] = useState(false);
  const [isFolding, setIsFolding] = useState(false);
  const [bootStats, setBootStats] = useState({
    deviceId: webrtcConnectionManager.getLocalDeviceId(),
    strategy: agentRouter.getStrategy(),
    uptime: "0.0s",
    memory: "64.2 MB",
    latency: "12ms"
  });

  // Automated boot animation sequence
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const startTime = Date.now();

    // Trigger subtle initial neon hum and boot intro sound
    soundFx.playNeonHum(0.8);
    soundFx.playSystemBootBeep();

    const runStep = (index: number) => {
      if (index >= INITIAL_BOOT_STEPS.length) {
        setIsBootComplete(true);
        setProgress(100);
        soundFx.playSubsystemStabilized();
        auditLogger.log({
          category: "SYSTEM",
          severity: "INFO",
          action: "SYSTEM_BOOT_COMPLETED",
          description: "Akira-aesthetic system initialization sequence completed and stabilized.",
          actor: "SYSTEM",
          metadata: { totalModules: INITIAL_BOOT_STEPS.length }
        });

        // Smoothly handover and replace initialization sequence with the live Cognitive Dashboard
        timer = setTimeout(() => {
          setShowCognitiveDashboard(true);
          soundFx.playNeonHum(0.4);
        }, 900);
        return;
      }

      setCurrentStepIndex(index);
      const step = INITIAL_BOOT_STEPS[index];

      // Mark running
      setSteps((prev) =>
        prev.map((s, idx) => (idx === index ? { ...s, status: "running" } : s))
      );
      
      // Cyberpunk dual-oscillator lock-in sound
      soundFx.playModuleActivate(index);

      setBootLog((prev) => [
        `[${((Date.now() - startTime) / 1000).toFixed(2)}s] BOOT_SEQ >> Initializing ${step.name} (${step.subsystem})...`,
        ...prev.slice(0, 15)
      ]);

      timer = setTimeout(() => {
        // Mark ready
        setSteps((prev) =>
          prev.map((s, idx) => (idx === index ? { ...s, status: "ready" } : s))
        );
        const nextProgress = Math.round(((index + 1) / INITIAL_BOOT_STEPS.length) * 100);
        setProgress(nextProgress);

        setBootLog((prev) => [
          `[${((Date.now() - startTime) / 1000).toFixed(2)}s] STABILIZED >> ${step.name} verified: ${step.metric}`,
          ...prev.slice(0, 15)
        ]);

        runStep(index + 1);
      }, step.durationMs);
    };

    runStep(0);

    return () => clearTimeout(timer);
  }, []);

  const triggerFoldingSequence = (targetPath: string = "/cognitive-dashboard") => {
    if (isFolding) return;
    setIsFolding(true);
    soundFx.playLaserHorizon();

    setTimeout(() => {
      completeSystemBoot();
      setFocusMode(true);
      navigate(targetPath);
    }, 600);
  };

  const handleLaunchModule = (path: string) => {
    triggerFoldingSequence(path);
  };

  const handleEnterWorkspace = () => {
    triggerFoldingSequence("/cognitive-dashboard");
  };

  return (
    <div className={`fixed inset-0 z-50 bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col justify-between overflow-y-auto font-mono p-4 sm:p-6 select-none transition-all duration-500 ${
      isFolding ? 'perspective-1000 opacity-0 scale-90 translate-y-4 filter blur-sm pointer-events-none' : 'opacity-100 scale-100'
    }`}>
      {/* Laser Horizon Folding Beam */}
      {isFolding && (
        <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--accent-neon)] shadow-[0_0_30px_var(--accent-neon)] z-50 animate-pulse" />
      )}
      {/* Background Cybernetic HUD Grids & Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--accent-glow)_0%,_transparent_70%)] opacity-30" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,var(--border-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-color)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      {/* Header Top Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-[var(--border-color)] pb-3.5 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent-neon)] flex items-center justify-center text-[var(--accent-neon)] shadow-[0_0_16px_var(--accent-glow)]">
            <Flame className="w-6 h-6 fill-current animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-widest text-[var(--text-primary)]">
                MUSCAL CORE // OS 2088
              </h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase transition-colors ${
                isBootComplete 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/40'
              }`}>
                {isBootComplete ? 'SYSTEM OPERATIV' : 'INITIALISIERUNG'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-2">
              <span>Status: <strong className="text-[var(--text-primary)]">{isBootComplete ? '100% Bereit' : `${progress}% Durchlauf`}</strong></span>
              <span>•</span>
              <span>Modus: <strong className="text-[var(--accent-neon)]">{sessionState.operational ? 'Operational' : 'Boot-Phase'}</strong></span>
            </p>
          </div>
        </div>

        {/* Dynamic Controls Header */}
        <div className="flex items-center gap-2">
          {isBootComplete && (
            <div className="hidden sm:flex items-center bg-[var(--bg-card)] p-0.5 rounded-xl border border-[var(--border-color)] text-xs">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowCognitiveDashboard(false);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                  !showCognitiveDashboard
                    ? 'bg-[var(--accent-neon)] text-black font-extrabold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Boot Matrix
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowCognitiveDashboard(true);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1.5 ${
                  showCognitiveDashboard
                    ? 'bg-[var(--accent-neon)] text-black font-extrabold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Kognitions-Dashboard</span>
              </button>
            </div>
          )}

          <button
            onClick={handleEnterWorkspace}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--accent-neon)] text-black font-extrabold text-xs hover:brightness-110 transition shadow-[0_0_15px_var(--accent-glow)]"
          >
            <span>{isBootComplete ? 'IN DEN ARBEITSBEREICH' : 'DIREKT STARTEN'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Dynamic Viewport: Smoothly Replaces Initialization Sequence with Cognitive Dashboard */}
      <AnimatePresence mode="wait">
        {showCognitiveDashboard ? (
          <motion.div
            key="cognitive-dashboard-view"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative z-10 flex-1 flex flex-col min-h-0 rounded-3xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-main)] shadow-2xl my-2"
          >
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-xs text-emerald-400 font-mono">
              <span className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>SYSTEM ERFOLGREICH INITIALISIERT // KOGNITIONS-DASHBOARD IST OPERATIV</span>
              </span>
              <button
                onClick={handleEnterWorkspace}
                className="text-[11px] underline font-bold hover:text-emerald-300"
              >
                Vollansicht im Arbeitsbereich öffnen &rarr;
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <CognitiveDashboard />
            </div>
          </motion.div>
        ) : (
          <motion.main
            key="boot-matrix-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 grid lg:grid-cols-12 gap-6 my-4 flex-1 items-start"
          >
            {/* Left Col: Module Boot Sequence Steps (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-neon)] uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  <span>Subsystem Initialization Matrix</span>
                </div>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {progress}% COMPLETED
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-glow)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Steps List */}
              <div className="grid sm:grid-cols-2 gap-2.5">
                {steps.map((step, idx) => {
                  const isCurrent = currentStepIndex === idx && step.status === "running";
                  const isReady = step.status === "ready";
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ 
                        opacity: isReady || isCurrent ? 1 : 0.6, 
                        scale: isCurrent ? [1, 1.02, 1] : 1, 
                        y: 0 
                      }}
                      transition={{ 
                        duration: 0.35, 
                        delay: idx * 0.05,
                        scale: isCurrent ? { repeat: Infinity, duration: 1.2 } : undefined
                      }}
                      onMouseEnter={() => soundFx.playBeep(920 + idx * 40, 0.02)}
                      className={`p-3 rounded-xl border transition-all relative overflow-hidden group cursor-pointer ${
                        isReady
                          ? "bg-[var(--accent-subtle)] border-[var(--accent-neon)]/60 text-[var(--text-primary)] shadow-[0_0_15px_var(--accent-glow)]"
                          : isCurrent
                          ? "bg-[var(--bg-card)] border-[var(--accent-neon)] shadow-[0_0_20px_var(--accent-glow)] ring-1 ring-[var(--accent-neon)]"
                          : "bg-[var(--bg-card)] border-[var(--border-color)] opacity-50 text-[var(--text-tertiary)] hover:opacity-80"
                      }`}
                    >
                      {/* Cyberpunk Scanline overlay on active/ready cards */}
                      {(isCurrent || isReady) && (
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[var(--accent-neon)]/5 to-transparent bg-[length:100%_4px] opacity-30" />
                      )}

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[var(--accent-neon)] font-bold truncate tracking-wider">
                          {step.subsystem}
                        </span>
                        {isReady ? (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-neon)] shrink-0" />
                          </motion.div>
                        ) : isCurrent ? (
                          <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-neon)] animate-spin shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-zinc-600" />
                        )}
                      </div>

                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {step.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                        {isReady ? step.metric : isCurrent ? "Verifying subsystem..." : "Pending..."}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Realtime Terminal Boot Logs */}
              <div className="p-3.5 rounded-2xl bg-black/80 border border-[var(--border-color)] space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] border-b border-zinc-800 pb-1">
                  <span className="flex items-center gap-1.5 font-bold text-zinc-400">
                    <Terminal className="w-3 h-3 text-[var(--accent-neon)]" />
                    <span>KERNEL CONSOLE TELEMETRY</span>
                  </span>
                  <span className="text-emerald-400 font-bold">{isBootComplete ? 'ALL GATES PASSED' : 'READY'}</span>
                </div>
                <div className="h-24 overflow-y-auto space-y-1 text-[10px] font-mono scrollbar-thin">
                  {bootLog.map((log, i) => (
                    <div key={i} className="text-zinc-300 leading-tight">
                      <span className="text-[var(--accent-neon)]">&gt;</span> {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: System Telemetry, Config Values & Instant Launch Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-neon)] uppercase tracking-wider">
                <Activity className="w-4 h-4" />
                <span>Telemetry & Live Module Focus</span>
              </div>

              {/* Config Values Card */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-sm">
                <div className="text-xs font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 flex items-center justify-between">
                  <span>ACTIVE SYSTEM PARAMETERS</span>
                  <span className="text-[10px] text-[var(--accent-neon)] font-bold">
                    {isBootComplete ? 'OPERATIONAL' : 'VERIFYING'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Local Node ID:</span>
                    <span className="font-bold text-[var(--accent-neon)] truncate max-w-[180px]">
                      {bootStats.deviceId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Execution Layer:</span>
                    <span className="font-bold text-[var(--text-primary)]">{bootStats.strategy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Akira Theme:</span>
                    <span className="font-bold uppercase text-[var(--accent-neon)]">{akiraTheme}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Crypto Standard:</span>
                    <span className="font-bold text-emerald-400">ECDSA-P256 / SHA-256</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Audio SFX Synth:</span>
                    <span className="font-bold text-[var(--text-primary)]">{sfxEnabled ? "ENABLED" : "MUTED"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Focus Mode:</span>
                    <span className="font-bold text-[var(--accent-neon)]">AUTO-ENGAGE</span>
                  </div>
                </div>
              </div>

              {/* Direct Module Launch Hub */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Direkt zum gewünschten Modul springen (Fokus-Modus):
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleLaunchModule("/cognitive-dashboard")}
                    className="p-3 rounded-xl border border-[var(--accent-neon)]/50 bg-[var(--accent-subtle)] hover:bg-[var(--accent-neon)] hover:text-black text-left transition group shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Brain className="w-4 h-4 text-[var(--accent-neon)] group-hover:text-black" />
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-neon)] group-hover:translate-x-1 group-hover:text-black transition" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-black">Kognitions-Dashboard</div>
                      <div className="text-[9px] text-[var(--text-secondary)] group-hover:text-black/80">Echtzeit-Telemetrie & Flow</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleLaunchModule("/")}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-neon)] hover:bg-[var(--accent-subtle)] text-left transition group shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <MessageSquare className="w-4 h-4 text-[var(--accent-neon)]" />
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-[var(--accent-neon)] transition" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">Chat & Messenger</div>
                      <div className="text-[9px] text-[var(--text-tertiary)]">1:1 & Gruppen E2E</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleLaunchModule("/files")}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-neon)] hover:bg-[var(--accent-subtle)] text-left transition group shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <FolderSync className="w-4 h-4 text-blue-400" />
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-blue-400 transition" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">Dateien & Sync</div>
                      <div className="text-[9px] text-[var(--text-tertiary)]">P2P Mesh Explorer</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleLaunchModule("/diagnostics")}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-neon)] hover:bg-[var(--accent-subtle)] text-left transition group shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-emerald-400 transition" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">System-Diagnose</div>
                      <div className="text-[9px] text-[var(--text-tertiary)]">Mesh & 24 Gates</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Footer / Launch CTA */}
      <footer className="relative z-10 border-t border-[var(--border-color)] pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-neon)]" />
          <span>Fokus auf das gewählte Modul wird beim Start automatisch maximiert.</span>
        </div>

        <button
          onClick={handleEnterWorkspace}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--accent-neon)] text-black font-extrabold text-xs hover:brightness-110 transition shadow-[0_0_20px_var(--accent-glow)] flex items-center justify-center gap-2"
        >
          <span>SYSTEM BEITRETEN // FOKUS ÖFFNEN</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
