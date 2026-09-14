/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Floating Akira Focus Mode HUD
 * Appears when Focus Mode is engaged to keep navigation fluid, minimal, and 100% focused on the active module.
 */

import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useMuscalStore } from "@/store/useMuscalStore";
import { soundFx } from "@/lib/soundFx";
import { 
  Maximize2, 
  Minimize2, 
  MessageSquare, 
  FolderSync, 
  MonitorSmartphone, 
  Activity, 
  Settings, 
  Flame, 
  RefreshCw,
  EyeOff,
  Eye,
  Volume2,
  VolumeX,
  Power
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function FocusModeHUD() {
  const { 
    focusMode, 
    toggleFocusMode, 
    triggerSystemBoot, 
    sfxEnabled, 
    toggleSfx 
  } = useMuscalStore();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const mainModules = [
    { path: "/", label: "Chat", icon: MessageSquare },
    { path: "/files", label: "Dateien", icon: FolderSync },
    { path: "/devices", label: "Geräte", icon: MonitorSmartphone },
    { path: "/diagnostics", label: "Diagnose", icon: Activity },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const currentModule = mainModules.find((m) => m.path === location.pathname) || {
    label: "Modul",
    icon: Flame
  };
  const CurrentIcon = currentModule.icon;

  return (
    <aside aria-label="HUD-Fokus-Bedienfeld" className="fixed top-2.5 right-3 z-40 flex items-center gap-1.5 font-mono select-none">
      {/* Main Focus Mode Pill */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-card)]/90 backdrop-blur-2xl border border-[var(--border-color)] shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all">
        {/* Module Label & Quick Drawer Toggle */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-primary)] transition"
          title="Schnellnavigation zwischen Modulen"
        >
          <CurrentIcon className="w-3.5 h-3.5 text-[var(--accent-neon)]" />
          <span className="hidden sm:inline uppercase tracking-tight">
            {currentModule.label}
          </span>
          {focusMode && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/30 font-bold">
              FOKUS
            </span>
          )}
        </button>

        {/* Focus Mode Toggle */}
        <button
          onClick={() => {
            soundFx.playConfirm();
            toggleFocusMode();
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold transition ${
            focusMode
              ? "bg-[var(--accent-neon)] text-black shadow-[0_0_10px_var(--accent-glow)]"
              : "bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
          }`}
          title={focusMode ? "Fokus-Modus beenden (Seitenleiste einblenden)" : "Fokus-Modus aktivieren (Ablenkungen ausblenden)"}
        >
          {focusMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{focusMode ? "FOKUS AN" : "FOKUS AUS"}</span>
        </button>

        {/* System Reboot / Boot Sequence trigger */}
        <button
          onClick={() => {
            soundFx.playBeep(880, 0.08);
            triggerSystemBoot();
          }}
          className="p-1.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--accent-neon)] transition"
          title="System Boot-Dashboard & Telemetrie neu starten"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded Quick Module Switcher Popover */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 p-2 rounded-2xl bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-color)] shadow-[0_16px_48px_rgba(0,0,0,0.6)] flex flex-col gap-1 min-w-[190px] z-50"
          >
            <div className="px-2 py-1 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold border-b border-[var(--border-color)] pb-1 mb-1">
              Hauptmodule Schnellfokus
            </div>
            {mainModules.map((mod) => {
              const Icon = mod.icon;
              const isActive = location.pathname === mod.path;
              return (
                <NavLink
                  key={mod.path}
                  to={mod.path}
                  onClick={() => {
                    soundFx.playClick();
                    setIsExpanded(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/50"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mod.label}</span>
                </NavLink>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
