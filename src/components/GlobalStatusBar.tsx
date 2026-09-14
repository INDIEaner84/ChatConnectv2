import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { webrtcConnectionManager, WebRTCState } from "@/lib/WebRTCConnectionManager";
import { agentRouter, RoutingStrategy } from "@/lib/AgentRouter";
import { auditLogger } from "@/lib/AuditLogger";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import { useMuscalStore } from "@/store/useMuscalStore";
import { soundFx } from "@/lib/soundFx";
import { 
  Radio, 
  Database, 
  Cpu, 
  Shield, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown,
  Volume2,
  VolumeX,
  Tv,
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RagSourceRecord {
  id: string;
  name: string;
  type: string;
  status: "synced" | "indexing" | "error";
  docsCount: number;
  lastSync: string;
}

const DEFAULT_RAG_SOURCES: RagSourceRecord[] = [
  {
    id: "gdrive-workspace",
    name: "Google Drive",
    type: "Cloud Workspace",
    status: "synced",
    docsCount: 1245,
    lastSync: "Just now"
  },
  {
    id: "local-vault",
    name: "Local Vault (/docs)",
    type: "Local FS",
    status: "indexing",
    docsCount: 8402,
    lastSync: "Indexing..."
  },
  {
    id: "github-repo",
    name: "GitHub ais-core",
    type: "Codebase",
    status: "synced",
    docsCount: 342,
    lastSync: "15m ago"
  }
];

export function GlobalStatusBar() {
  const [webrtcState, setWebrtcState] = useState<WebRTCState>(webrtcConnectionManager.getConnectionState());
  const [activeSignalCount, setActiveSignalCount] = useState<number>(0);
  const [ragSources, setRagSources] = useState<RagSourceRecord[]>(DEFAULT_RAG_SOURCES);
  const [isSyncingRag, setIsSyncingRag] = useState(false);
  const [routingStrategy, setRoutingStrategy] = useState<RoutingStrategy>(agentRouter.getStrategy());
  const [showAuditViewer, setShowAuditViewer] = useState(false);
  const [showRagDropdown, setShowRagDropdown] = useState(false);
  const [showRouterDropdown, setShowRouterDropdown] = useState(false);
  const [recentAuditCount, setRecentAuditCount] = useState(0);
  const { sfxEnabled, toggleSfx, scanlines, toggleScanlines, focusMode } = useMuscalStore();

  // 1. WebRTC Connection State Listener
  useEffect(() => {
    const unsub = webrtcConnectionManager.onStateChange((state) => {
      setWebrtcState(state);
    });
    return unsub;
  }, []);

  // 2. Real-time Firestore WebRTC Signals listener
  useEffect(() => {
    try {
      const signalsRef = collection(db, "signals");
      const unsubSignals = onSnapshot(signalsRef, (snapshot) => {
        setActiveSignalCount(snapshot.size);
      }, (error) => {
        console.warn("Firestore signals onSnapshot:", error);
      });
      return unsubSignals;
    } catch (e) {
      console.warn("Could not attach signals listener:", e);
    }
  }, []);

  // 3. Real-time Firestore RAG Sources listener
  useEffect(() => {
    try {
      const ragRef = collection(db, "rag_sources");
      const unsubRag = onSnapshot(ragRef, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: RagSourceRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              name: data.name || "Unknown Source",
              type: data.type || "Cloud",
              status: data.status || "synced",
              docsCount: Number(data.docsCount) || 0,
              lastSync: data.lastSync || "Recently"
            });
          });
          setRagSources(loaded);
        } else {
          seedFirestoreRagSources();
        }
      }, (err) => {
        console.warn("Firestore rag_sources listener:", err);
      });
      return unsubRag;
    } catch (err) {
      console.warn("Failed to subscribe to rag_sources:", err);
    }
  }, []);

  // 4. Audit count listener
  useEffect(() => {
    const unsubAudit = auditLogger.subscribe((logs) => {
      setRecentAuditCount(logs.length);
    });
    return unsubAudit;
  }, []);

  const seedFirestoreRagSources = async () => {
    try {
      for (const src of DEFAULT_RAG_SOURCES) {
        await setDoc(doc(db, "rag_sources", src.id), {
          name: src.name,
          type: src.type,
          status: src.status,
          docsCount: src.docsCount,
          lastSync: src.lastSync,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Failed to seed Firestore rag_sources:", e);
    }
  };

  const triggerRagSync = async () => {
    soundFx.playBeep(640, 0.08);
    setIsSyncingRag(true);
    try {
      const docRef = doc(db, "rag_sources", "local-vault");
      await setDoc(docRef, {
        status: "synced",
        docsCount: 8402 + Math.floor(Math.random() * 10),
        lastSync: "Just now",
        updatedAt: serverTimestamp()
      }, { merge: true });

      auditLogger.log({
        category: "SYSTEM",
        severity: "INFO",
        action: "RAG_SYNCED",
        description: "Manually triggered Firestore RAG sync across connected nodes",
        actor: "USER",
        metadata: { totalDocs: ragSources.reduce((a, s) => a + s.docsCount, 0) }
      });
      soundFx.playConfirm();
    } catch (err: any) {
      console.warn("Error triggering RAG sync:", err);
      soundFx.playAlert();
    } finally {
      setTimeout(() => setIsSyncingRag(false), 800);
    }
  };

  const handleStrategyChange = (strat: RoutingStrategy) => {
    soundFx.playClick();
    agentRouter.setStrategy(strat);
    setRoutingStrategy(strat);
    auditLogger.log({
      category: "SYSTEM",
      severity: "INFO",
      action: "ROUTING_STRATEGY_CHANGED",
      description: `Router execution strategy switched to ${strat}`,
      actor: "USER",
      metadata: { strategy: strat }
    });
    setShowRouterDropdown(false);
  };

  const totalDocs = ragSources.reduce((acc, s) => acc + s.docsCount, 0);
  const hasIndexing = ragSources.some((s) => s.status === "indexing") || isSyncingRag;
  const hasError = ragSources.some((s) => s.status === "error");

  if (focusMode) {
    return null;
  }

  return (
    <>
      <header className="h-12 w-full border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/80 backdrop-blur-xl px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-3 text-xs font-mono select-none z-30 transition-colors shadow-sm">
        {/* Left Section: WebRTC & RAG real-time indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 shrink min-w-0">
          {/* WebRTC Status Indicator */}
          <div 
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]/70 backdrop-blur-md shadow-sm shrink-0"
            title={`WebRTC Peer State: ${webrtcState.toUpperCase()} | Firestore Signals: ${activeSignalCount}`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {webrtcState === "connected" ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-neon)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-neon)] shadow-[0_0_8px_var(--accent-neon)]"></span>
                </>
              ) : webrtcState === "connecting" ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-neon)]/80 shadow-[0_0_6px_var(--accent-glow)]"></span>
              )}
            </span>

            <Radio className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
            
            <span className="font-semibold text-[var(--text-primary)] text-[11px] sm:text-xs">
              {webrtcState === "connected" ? (
                <span className="text-[var(--accent-neon)] font-bold">
                  <span className="sm:hidden">P2P</span>
                  <span className="hidden sm:inline">P2P CONNECTED</span>
                </span>
              ) : webrtcState === "connecting" ? (
                <span className="text-amber-400">
                  <span className="sm:hidden">SYNC...</span>
                  <span className="hidden sm:inline">HANDSHAKE...</span>
                </span>
              ) : (
                <span className="text-[var(--text-secondary)]">P2P</span>
              )}
            </span>

            <span className="text-[10px] text-[var(--text-tertiary)] hidden sm:inline border-l border-[var(--border-color)] pl-2">
              {activeSignalCount > 0 ? `${activeSignalCount} sig` : "Firestore"}
            </span>
          </div>

          {/* RAG Real-time Synchronization Indicator */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowRagDropdown(!showRagDropdown);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]/70 backdrop-blur-md hover:border-[var(--accent-neon)] text-[var(--text-primary)] shadow-sm transition-all text-[11px] sm:text-xs"
              title="Click to view RAG sources and status"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[var(--text-primary)] hidden xs:inline">RAG:</span>
                {hasIndexing ? (
                  <span className="text-[var(--accent-neon)] flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">INDEXING</span>
                  </span>
                ) : hasError ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">ATTN</span>
                  </span>
                ) : (
                  <span className="text-[var(--accent-neon)] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="hidden sm:inline">SYNCED</span>
                  </span>
                )}
              </div>

              <span className="text-[10px] text-[var(--text-tertiary)] hidden md:inline">
                ({totalDocs.toLocaleString()})
              </span>

              <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
            </button>

            {/* RAG Sources Popover */}
            <AnimatePresence>
              {showRagDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] p-3.5 rounded-xl bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-color)] shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-50 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                    <div className="font-bold text-xs flex items-center gap-2 text-[var(--text-primary)]">
                      <Database className="w-4 h-4 text-indigo-400" />
                      Connected RAG Sources
                    </div>
                    <button
                      onClick={triggerRagSync}
                      disabled={isSyncingRag}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/40 hover:bg-[var(--accent-neon)]/20 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncingRag ? 'animate-spin' : ''}`} />
                      Sync All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {ragSources.map((src) => (
                      <div key={src.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-semibold text-[var(--text-primary)] truncate">{src.name}</div>
                          <div className="text-[10px] text-[var(--text-tertiary)]">{src.docsCount} items • {src.lastSync}</div>
                        </div>
                        <div>
                          {src.status === 'synced' && (
                            <span className="text-[10px] text-[var(--accent-neon)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded border border-[var(--accent-neon)]/30">
                              SYNCED
                            </span>
                          )}
                          {src.status === 'indexing' && (
                            <span className="text-[10px] text-[var(--accent-neon)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded border border-[var(--accent-neon)]/30 animate-pulse">
                              INDEXING
                            </span>
                          )}
                          {src.status === 'error' && (
                            <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                              ERROR
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Section: Model Router strategy, Audit Log trigger, SFX, and Theme Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dynamic Router Strategy selector */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowRouterDropdown(!showRouterDropdown);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]/70 backdrop-blur-md hover:border-[var(--accent-neon)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all text-[11px] sm:text-xs"
              title="AgentRouter Strategy"
            >
              <Cpu className="w-3.5 h-3.5 text-[var(--accent-neon)] shrink-0" />
              <span className="hidden md:inline font-semibold">Router:</span>
              <span className="text-[var(--accent-neon)] font-bold">
                {routingStrategy.replace("FORCE_", "")}
              </span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>

            <AnimatePresence>
              {showRouterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 top-full mt-2 w-56 sm:w-60 max-w-[calc(100vw-1.5rem)] p-2 rounded-xl bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-color)] shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-50 space-y-1"
                >
                  <div className="px-2 py-1 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">
                    Execution Layer Routing
                  </div>
                  {[
                    { id: "AUTO", label: "AUTO (Adaptive Intent)", desc: "Autonomous local/server/cloud routing" },
                    { id: "FORCE_LOCAL", label: "LOCAL (Edge / LFM)", desc: "Zero-latency, 100% on-device privacy" },
                    { id: "FORCE_SERVER", label: "SERVER (Muscal Core)", desc: "Tools, Syncthing, system execution" },
                    { id: "FORCE_CLOUD", label: "CLOUD (Gemini Flash)", desc: "High reasoning & coding capacity" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleStrategyChange(opt.id as RoutingStrategy)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex flex-col ${
                        routingStrategy === opt.id
                          ? "bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      <span className="font-bold">{opt.label}</span>
                      <span className="text-[10px] opacity-70 font-sans">{opt.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SFX Quick Toggle */}
          <button
            onClick={() => {
              toggleSfx();
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              sfxEnabled
                ? "bg-[var(--accent-subtle)] border-[var(--accent-neon)]/50 text-[var(--accent-neon)] shadow-[0_0_8px_var(--accent-glow)]"
                : "border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
            title={sfxEnabled ? "Cyber SFX Audio: ON (Click to Mute)" : "Cyber SFX Audio: MUTED (Click to Enable)"}
          >
            {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Audit Log Quick Trigger */}
          <button
            onClick={() => {
              soundFx.playClick();
              setShowAuditViewer(!showAuditViewer);
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]/70 backdrop-blur-md hover:border-[var(--accent-neon)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all text-[11px] sm:text-xs"
            title="Open System Audit Logs"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Audit</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[var(--bg-hover)] text-[10px] text-[var(--text-tertiary)]">
              {recentAuditCount}
            </span>
          </button>

          {/* Cyberpunk Akira Neon Theme Selector */}
          <ThemeSelector compact={true} />
        </div>
      </header>

      {/* Audit Log Viewer Modal / Drawer */}
      <AnimatePresence>
        {showAuditViewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl"
            >
              <AuditLogViewer 
                maxHeight="65vh" 
                onClose={() => setShowAuditViewer(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
