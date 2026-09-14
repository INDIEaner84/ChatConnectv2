import React, { useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useMuscalStore } from "@/store/useMuscalStore";
import {
  MessageSquare,
  FolderSync,
  MonitorSmartphone,
  Activity,
  Settings,
  Brain,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface MobileNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: string;
  summary: string;
  explanation: string;
  highlights: string[];
}

const mobileNavItems: MobileNavItem[] = [
  {
    icon: MessageSquare,
    label: "Chat",
    path: "/",
    badge: "E2E",
    summary: "Dezentraler 1:1 und Gruppen-Messenger",
    explanation:
      "Vollständig lokaler Messenger (Local-First) mit automatischer Outbox-Pufferung bei Verbindungsverlust, kryptografischer ECDSA-P256-Signatur, Replay-Schutz und Offline-Resilienz.",
    highlights: ["Local-First Outbox", "1:1 & Gruppen", "WebCrypto"],
  },
  {
    icon: FolderSync,
    label: "Dateien",
    path: "/files",
    badge: "Sync",
    summary: "Dezentraler Datei-Explorer & Mesh-Sync",
    explanation:
      "Verwaltet Anhänge, Dokumente und Medien im lokalen IndexedDB-Speicher mit SHA-256 Integritätshash und P2P-Mesh-Synchronisation.",
    highlights: ["SHA-256", "P2P Mesh Sync", "IndexedDB"],
  },
  {
    icon: MonitorSmartphone,
    label: "Geräte",
    path: "/devices",
    badge: "QR",
    summary: "Zero-Trust Gerätekopplung per QR-Code",
    explanation:
      "Verbindet Browser, Handys und Desktops über kryptografisch signierte QR-Einladungstoken mit Ablaufzeit und direktem WebRTC-Mesh.",
    highlights: ["QR-Token", "WebRTC P2P", "Zero-Trust"],
  },
  {
    icon: Brain,
    label: "Kognitions-OS",
    path: "/cognitive-os",
    badge: "AI OS",
    summary: "Echtzeit-Gedankenraum & Kausalgraph",
    explanation:
      "Mensch-KI Kognitionsschnittstelle mit progressivem Kognitions-Schieberegler, Hypothesen-Divergenz und Design-Evolution.",
    highlights: ["Kausalgraph", "5 Kognitionsstufen", "Design Evolution"],
  },
  {
    icon: Activity,
    label: "Diagnose",
    path: "/diagnostics",
    summary: "Echtzeit-Zustand des lokalen Knotens",
    explanation:
      "Überwacht Speicherverbrauch (IndexedDB Quota), P2P-Netzwerklatenzen, Outbox-Nachrichtenwarteschlangen und Schlüsselintegrität.",
    highlights: ["IndexedDB Quota", "Mesh-Latenz"],
  },
  {
    icon: Settings,
    label: "Optionen",
    path: "/settings",
    summary: "Identitätsverwaltung, Design & Speicher",
    explanation:
      "Verwalten Sie Ihre kryptografische Identität, exportieren Sie Zertifikate, wechseln Sie das Farbschema oder verwalten Sie den lokalen Cache.",
    highlights: ["Identitäts-Export", "Theme", "Cache"],
  },
];

export function MobileNav() {
  const { focusMode } = useMuscalStore();
  const [activeExplanation, setActiveExplanation] = useState<MobileNavItem | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (focusMode) {
    return null;
  }

  const handleTouchStart = (item: MobileNavItem) => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      setActiveExplanation(item);
    }, 400); // 400ms hold triggers explanation
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-sidebar)]/95 backdrop-blur-md border-t border-[var(--border-color)] pb-safe transition-colors z-30">
        <ul className="flex justify-around p-1.5">
          {mobileNavItems.map((item) => (
            <li key={item.path} className="flex-1">
              <NavLink
                to={item.path}
                onTouchStart={() => handleTouchStart(item)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-medium transition-colors relative",
                    isActive
                      ? "text-emerald-500 font-semibold"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  )
                }
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="tracking-tight">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Touch & Hold Modal Explanation */}
      <AnimatePresence>
        {activeExplanation && (
          <div
            onClick={() => setActiveExplanation(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl border border-emerald-500/30 bg-[var(--bg-sidebar)] p-5 shadow-2xl text-[var(--text-primary)] space-y-3"
            >
              <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                    <activeExplanation.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{activeExplanation.label}</h3>
                    <p className="text-[10px] text-[var(--text-tertiary)]">{activeExplanation.summary}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveExplanation(null)}
                  className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {activeExplanation.explanation}
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {activeExplanation.highlights.map((h) => (
                  <span
                    key={h}
                    className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                  >
                    {h}
                  </span>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center text-[10px] text-[var(--text-tertiary)]">
                <span>Gedrückt halten zur Info</span>
                <button
                  onClick={() => setActiveExplanation(null)}
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
