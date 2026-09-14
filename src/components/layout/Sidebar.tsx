import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  FolderSync,
  MonitorSmartphone,
  Activity,
  ShieldCheck,
  Terminal,
  Mic,
  Image,
  Database,
  Brain,
  Network,
  Bot,
  Wrench,
  Settings,
  Info,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Shield,
  Layers,
  SlidersHorizontal,
  Flame,
  Dna,
  Atom
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMuscalStore } from "@/store/useMuscalStore";
import { ThemeSelector } from "@/components/ThemeSelector";
import { PWAInstallButton } from "@/app/ui/components/PWAInstallButton";
import { ResizeHandle } from "@/components/ui/ResizeHandle";
import { motion, AnimatePresence } from "motion/react";
import { soundFx } from "@/lib/soundFx";

export interface NavItemConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  badgeColor?: string;
  path: string;
  isPrimary?: boolean;
  summary: string;
  explanation: string;
  highlights: string[];
}

export interface NavSection {
  title: string;
  id: string;
  items: NavItemConfig[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const navSections: NavSection[] = [
  {
    title: "Hauptmodule",
    id: "core",
    items: [
      {
        icon: Brain,
        label: "Kognitions-Dashboard",
        badge: "Live / Telemetrie",
        badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        path: "/cognitive-dashboard",
        isPrimary: true,
        summary: "Echtzeit-Kognitionsfluss, Agenten-Status & Systemgesundheit",
        explanation:
          "Dynamische Visualisierung des kognitiven Lebenszyklus, aktiver Agenten-Synapsen, WebRTC-Mesh-Gesundheit und automatisierter Zero-Trust Chaos-Gates.",
        highlights: ["Kognitiver Fluss", "Agenten-Schwarm", "Live-Telemetrie", "24 Gates"],
      },
      {
        icon: MessageSquare,
        label: "Chat & Messenger",
        badge: "Core / E2E",
        badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        path: "/",
        isPrimary: true,
        summary: "Dezentraler 1:1 und Gruppen-Messenger",
        explanation:
          "Vollständig lokaler Messenger (Local-First) mit automatischer Outbox-Pufferung bei Verbindungsverlust, kryptografischer ECDSA-P256-Signatur, Replay-Schutz und Offline-Resilienz.",
        highlights: ["Local-First Outbox", "1:1 & Gruppen", "WebCrypto ECDSA", "Zero-Cloud"],
      },
      {
        icon: FolderSync,
        label: "Dateien & Sync",
        badge: "P2P Mesh",
        badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        path: "/files",
        isPrimary: true,
        summary: "Dezentraler Datei-Explorer & Mesh-Synchronisation",
        explanation:
          "Verwaltet Anhänge, Dokumente und Medien im lokalen IndexedDB-Speicher. Berechnet SHA-256 Integritätshashes zur Duplikaterkennung und synchronisiert direkt über das P2P-Mesh.",
        highlights: ["SHA-256 Deduplizierung", "P2P Datei-Sync", "IndexedDB", "Drag & Drop"],
      },
      {
        icon: MonitorSmartphone,
        label: "Geräte-Kopplung",
        badge: "QR-Token",
        badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        path: "/devices",
        isPrimary: true,
        summary: "Sichere Zero-Trust Gerätekopplung per QR-Code",
        explanation:
          "Verbindet Browser, Handys und Desktops über kryptografisch signierte QR-Einladungstoken mit Ablaufzeit. Etabliert direkte WebRTC-Mesh-Kanäle ohne zentrale Serverkonten.",
        highlights: ["Signierte QR-Tokens", "WebRTC Mesh", "Multi-Device", "Zero-Trust"],
      },
    ],
  },
  {
    title: "Sicherheit & Diagnose",
    id: "security",
    items: [
      {
        icon: Activity,
        label: "System-Diagnose",
        path: "/diagnostics",
        summary: "Echtzeit-Zustand des lokalen Knotens und Netzwerks",
        explanation:
          "Überwacht Speicherverbrauch (IndexedDB Quota), P2P-Netzwerklatenzen, Outbox-Nachrichtenwarteschlangen und kryptografische Schlüsselintegrität.",
        highlights: ["IndexedDB Quota", "Mesh-Latenz", "Outbox-Monitor"],
      },
      {
        icon: ShieldCheck,
        label: "Test-Gates",
        badge: "24/24",
        badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        path: "/tests",
        summary: "24 automatisierte Sicherheits- & Resilienz-Gates",
        explanation:
          "Prüft Identitätstrennung, QR-Token-Signatur, Replay-Schutz, Lifecycle-Gewichtung und Chaos-Netzwerkausfälle auf Knopfdruck.",
        highlights: ["24 Acceptance Gates", "Chaos Engineering", "Replay-Prüfung"],
      },
      {
        icon: Terminal,
        label: "Audit-Logs & Trace",
        path: "/trace",
        summary: "Lückenlose Ereignis- & Sicherheitsüberwachung",
        explanation:
          "Detaillierter Audit-Stream aller kryptografischen Operationen und System-Events mit automatischer Bereinigung sensibler privater Schlüsseldaten.",
        highlights: ["Zero-Leakage Logging", "EventBus Stream", "Filterbar"],
      },
    ],
  },
  {
    title: "Kognitive KI-Module & OS",
    id: "cognitive",
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        icon: Brain,
        label: "Kognitions-OS (Mind Space)",
        path: "/cognitive-os",
        isPrimary: true,
        badge: "Live-Kognition",
        badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        summary: "Echtzeit-Gedankenstrukturierung & logischer Kausalgraph",
        explanation:
          "Visualisiert kognitive Prozesse, semantische Verknüpfungen, Hypothesen und nachvollziehbare Syntheseketten in einem interaktiven Graphen.",
        highlights: ["Echtzeit-Kausalgraph", "Transparente Synthese", "Progressive Disclosure"],
      },
      {
        icon: Dna,
        label: "Design Evolution Lab",
        path: "/design-lab",
        badge: "Gen Lab",
        badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        summary: "Evolutionäre UI-Prototypen, Kreuzung & Mutation",
        explanation:
          "Erforsche konkurrierende Paradigmen, vergleiche neuro-ergonomische Metriken und züchte neue Generationen von Mensch-KI-Schnittstellen.",
        highlights: ["Evolutionäre DNA", "Hybrid Breeder", "Metriken-Radar"],
      },
      {
        icon: Mic,
        label: "Sprachassistent",
        path: "/voice",
        summary: "Lokale Spracheingabe & Audio-Assistent",
        explanation:
          "Freihändige Bedienung mit lokaler VAD (Voice Activity Detection), Audiotranskription und bidirektionaler Sprachausgabe.",
        highlights: ["Voice Activity", "Audio Streaming", "Lokale Erkennung"],
      },
      {
        icon: Image,
        label: "Visuelle Analyse",
        path: "/vision",
        summary: "Multimodale Bild- und Dokumentenverarbeitung",
        explanation:
          "Optische Dokumentenerkennung, visuelle Analyse und On-Device-Inferenz für Fotos, Diagramme und Scans.",
        highlights: ["Multimodal", "Dokumentenscan", "Browser-Inferenz"],
      },
      {
        icon: Brain,
        label: "Kognitions-OS (Memory)",
        path: "/memory",
        summary: "Echtzeit-Gedankenstrukturierung & logischer Kausalgraph",
        explanation:
          "Visualisiert kognitive Prozesse, semantische Verknüpfungen, Hypothesen und nachvollziehbare Syntheseketten in einem interaktiven Graphen.",
        highlights: ["Echtzeit-Kausalgraph", "Transparente Synthese", "Neuro-Ergonomie"],
      },
      {
        icon: Brain,
        label: "Wissensquellen (RAG)",
        path: "/knowledge",
        summary: "Lokales RAG für Dokumente & Notizen",
        explanation:
          "Verbindet lokale Dokumentensammlungen für semantische Suche und kontextbezogene Antworten ohne externe Datenspeicherung.",
        highlights: ["Lokales RAG", "Semantische Suche", "Vektor-Embeddings"],
      },
      {
        icon: Network,
        label: "KI-Modelle & Routing",
        path: "/models",
        summary: "Hybrid-Routing zwischen lokalen und Cloud-Modellen",
        explanation:
          "Nahtloses Umschalten zwischen On-Device WebGPU-Modellen, lokalen Server-Instanzen (z. B. Ollama) und Cloud-APIs.",
        highlights: ["WebGPU On-Device", "Lokaler Server", "Cloud-Fallback"],
      },
      {
        icon: Bot,
        label: "Autonome Agenten",
        path: "/agents",
        summary: "Spezialisierte Agenten für Workflows",
        explanation:
          "Koordiniert spezialisierte Task-Agenten für Recherche, Zusammenfassungen, Datenaufbereitung und automatisierte Abläufe.",
        highlights: ["Multi-Agent", "Zustandsgraph", "Autonome Ausführung"],
      },
      {
        icon: Wrench,
        label: "Werkzeuge (Tools)",
        path: "/tools",
        summary: "Modulare Funktionsaufrufe & Sandbox-Plugins",
        explanation:
          "Schnittstellen für Dateisystemoperationen, Datensynchronisation und kontrollierte externe Funktionsaufrufe.",
        highlights: ["Tool Calling", "Sichere Sandbox", "Erweiterbar"],
      },
    ],
  },
  {
    title: "System",
    id: "system",
    items: [
      {
        icon: Settings,
        label: "Einstellungen",
        path: "/settings",
        summary: "Identitätsverwaltung, Design & Speicher",
        explanation:
          "Verwalten Sie Ihre kryptografische Identität, Farbschemata (Akira / Neon), SFX-Soundeffekte und System-Backups.",
        highlights: ["Akira Neon Paletten", "SFX Engine", "Identitäts-Export"],
      },
    ],
  },
];

export function Sidebar() {
  const { sidebarWidth, setSidebarWidth, akiraTheme, focusMode, toggleFocusMode, setFocusMode } = useMuscalStore();
  const [activeItemInfo, setActiveItemInfo] = useState<NavItemConfig | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cognitive: false,
  });
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveItemInfo(null);
        setHoverPosition(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const effectiveWidth = sidebarWidth;

  const toggleSection = (sectionId: string) => {
    soundFx.playClick();
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleMouseEnter = (item: NavItemConfig, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({
      top: Math.max(16, rect.top - 10),
      left: rect.right + 12,
    });
    setActiveItemInfo(item);
  };

  const handleMouseLeave = () => {
    setActiveItemInfo(null);
    setHoverPosition(null);
  };

  const handleTouchStart = (item: NavItemConfig, e: React.TouchEvent<HTMLElement>) => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    const touch = e.touches[0];
    touchTimerRef.current = setTimeout(() => {
      setHoverPosition({
        top: Math.min(window.innerHeight - 260, Math.max(20, touch.clientY - 60)),
        left: 20,
      });
      setActiveItemInfo(item);
    }, 350);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  // When focusMode is active, sidebar is completely hidden for 100% full-screen immersion
  if (focusMode) {
    return null;
  }

  return (
    <div className="hidden md:flex relative shrink-0 h-screen select-none">
      <motion.aside
        ref={sidebarRef}
        animate={{ width: effectiveWidth }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        style={{ width: `${effectiveWidth}px` }}
        className="flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)]/95 backdrop-blur-xl h-screen sticky top-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.35)] select-none overflow-hidden"
      >
        {/* Akira Cyberpunk Header */}
        <div className={`p-3 border-b border-[var(--border-color)] bg-gradient-to-b from-[var(--bg-active)]/50 to-transparent ${focusMode ? 'flex flex-col items-center gap-2' : ''}`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => {
                  soundFx.playConfirm();
                  toggleFocusMode();
                }}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent-neon)] to-rose-600 flex items-center justify-center text-white shadow-[0_0_12px_var(--accent-glow)] shrink-0 animate-pulse hover:scale-105 transition"
                title={focusMode ? "Seitenleiste vergrößern (Fokus-Modus beenden)" : "Fokus-Modus aktivieren (Ablenkungen ausblenden)"}
              >
                <Flame className="w-4 h-4 fill-current" />
              </button>
              
              {!focusMode && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-extrabold tracking-tight text-[var(--text-primary)] leading-tight font-mono">
                      MUSCAL
                    </h1>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/30 font-bold font-mono">
                      2088
                    </span>
                  </div>
                  <p className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold font-mono truncate">
                    ネオ東京 // P2P CORE
                  </p>
                </div>
              )}
            </div>

            {!focusMode && (
              <button
                onClick={() => {
                  soundFx.playConfirm();
                  toggleFocusMode();
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--accent-subtle)] border border-[var(--accent-neon)]/30 text-[var(--accent-neon)] text-[9px] font-bold font-mono shrink-0 hover:bg-[var(--accent-neon)] hover:text-black transition"
                title="Fokus-Modus aktivieren (Ablenkungen ausblenden)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-neon)] animate-ping" />
                <span>FOKUS</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Body */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
          {navSections.map((section) => {
            const isCollapsible = section.collapsible;
            const isExpanded = isCollapsible ? expandedSections[section.id] ?? false : true;

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                {!focusMode && (
                  <div className="flex items-center justify-between px-2 py-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] font-mono">
                      {section.title}
                    </span>
                    {isCollapsible && (
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--accent-neon)] flex items-center gap-1 transition-colors font-mono"
                        title={isExpanded ? "Einklappen" : "Ausklappen"}
                      >
                        <span>{isExpanded ? "Weniger" : `${section.items.length}`}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Section Items */}
                <AnimatePresence initial={false}>
                  {(isExpanded || focusMode) && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-1"
                    >
                      {section.items.map((item) => (
                        <li key={item.path} className="relative group">
                          <NavLink
                            to={item.path}
                            onClick={() => {
                              soundFx.playClick();
                              setFocusMode(true);
                            }}
                            onMouseEnter={(e) => handleMouseEnter(item, e)}
                            onMouseLeave={handleMouseLeave}
                            onTouchStart={(e) => handleTouchStart(item, e)}
                            onTouchEnd={handleTouchEnd}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center rounded-xl transition-all font-medium text-xs relative",
                                focusMode ? "justify-center p-2.5" : "justify-between px-2.5 py-2",
                                item.isPrimary
                                  ? isActive
                                    ? "bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)] font-bold shadow-[0_0_12px_var(--accent-glow)]"
                                    : "bg-[var(--bg-card)]/50 hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)]/60 hover:border-[var(--accent-neon)]/50"
                                  : isActive
                                  ? "bg-[var(--bg-active)] text-[var(--accent-neon)] font-bold border border-[var(--accent-neon)]/60 shadow-sm"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                              )
                            }
                            title={focusMode ? `${item.label}: ${item.summary}` : undefined}
                          >
                            <div className={cn("flex items-center min-w-0", focusMode ? "justify-center" : "gap-2.5")}>
                              <div
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors shrink-0",
                                  item.isPrimary
                                    ? "bg-[var(--accent-subtle)] text-[var(--accent-neon)]"
                                    : "text-[var(--text-tertiary)] group-hover:text-[var(--accent-neon)]"
                                )}
                              >
                                <item.icon className="w-3.5 h-3.5" />
                              </div>
                              {!focusMode && <span className="truncate">{item.label}</span>}
                            </div>

                            {!focusMode && (
                              <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                                {item.badge && (
                                  <span
                                    className={cn(
                                      "px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border leading-none tracking-tight",
                                      item.badgeColor ||
                                        "bg-[var(--bg-main)] text-[var(--text-tertiary)] border-[var(--border-color)]"
                                    )}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    soundFx.playBeep(1200, 0.03);
                                    handleMouseEnter(item, e);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-tertiary)] hover:text-[var(--accent-neon)] transition-opacity"
                                  title="Erklärung anzeigen"
                                >
                                  <Info className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer Area with Theme Selector & PWA */}
        <div className={`p-2.5 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] space-y-2 ${focusMode ? 'flex flex-col items-center' : ''}`}>
          {!focusMode ? (
            <>
              <div className="flex items-center justify-between gap-1">
                <PWAInstallButton />
                <ThemeSelector compact={true} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-mono px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-neon)]" />
                  <span>AKIRA // CORE</span>
                </span>
                <span>{sidebarWidth}px</span>
              </div>
            </>
          ) : (
            <button
              onClick={() => {
                soundFx.playClick();
                toggleFocusMode();
              }}
              className="p-2 rounded-xl bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-[var(--accent-neon)] border border-[var(--border-color)] transition"
              title="Seitenleiste vergrößern"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Draggable Edge Resize Handle on Right Border */}
      {!focusMode && (
        <ResizeHandle
          orientation="vertical"
          onResize={(delta) => {
            setSidebarWidth(sidebarWidth + delta);
          }}
          id="sidebar-edge-resize"
        />
      )}

      {/* Floating Explanation Card */}
      <AnimatePresence>
        {activeItemInfo && hoverPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              top: hoverPosition.top,
              left: hoverPosition.left,
              maxWidth: 320,
              zIndex: 9999,
            }}
            className="hidden md:block rounded-2xl border border-[var(--accent-neon)]/40 bg-[var(--bg-sidebar)]/95 backdrop-blur-xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] text-[var(--text-primary)] pointer-events-auto"
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-start justify-between gap-2 border-b border-[var(--border-color)] pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-neon)]">
                  <activeItemInfo.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    {activeItemInfo.label}
                    {activeItemInfo.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/30">
                        {activeItemInfo.badge}
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {activeItemInfo.summary}
                  </p>
                </div>
              </div>
              <button
                onClick={handleMouseLeave}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
                title="Schließen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
              {activeItemInfo.explanation}
            </p>

            <div className="mt-3 pt-2.5 border-t border-[var(--border-color)] flex flex-wrap gap-1.5">
              {activeItemInfo.highlights.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-[var(--bg-main)] text-[10px] text-[var(--text-secondary)] border border-[var(--border-color)] font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Modal Explanation */}
      <AnimatePresence>
        {activeItemInfo && (
          <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl border border-[var(--accent-neon)]/40 bg-[var(--bg-sidebar)] p-5 shadow-2xl text-[var(--text-primary)] space-y-3"
            >
              <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-neon)]">
                    <activeItemInfo.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{activeItemInfo.label}</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">{activeItemInfo.summary}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveItemInfo(null)}
                  className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {activeItemInfo.explanation}
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveItemInfo(null)}
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent-neon)] text-black font-bold text-xs shadow-md"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
