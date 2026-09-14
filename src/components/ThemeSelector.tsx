/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Akira & Cyberpunk Neon Theme Selector Dropdown
 */

import React, { useState } from "react";
import { Palette, ChevronDown, Check, Volume2, VolumeX, Tv } from "lucide-react";
import { useMuscalStore } from "@/store/useMuscalStore";
import { AKIRA_THEMES, AkiraThemeId } from "@/lib/themeEngine";
import { motion, AnimatePresence } from "motion/react";
import { soundFx } from "@/lib/soundFx";

interface ThemeSelectorProps {
  compact?: boolean;
  className?: string;
}

export function ThemeSelector({ compact = false, className = "" }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { akiraTheme, setAkiraTheme, scanlines, toggleScanlines, sfxEnabled, toggleSfx } = useMuscalStore();

  const currentTheme = AKIRA_THEMES.find(t => t.id === akiraTheme) || AKIRA_THEMES[0];

  const handleSelectTheme = (id: AkiraThemeId) => {
    setAkiraTheme(id);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => {
          soundFx.playClick();
          setIsOpen(!isOpen);
        }}
        id="akira-theme-selector-btn"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]/80 hover:border-[var(--accent-neon)] text-[var(--text-primary)] transition-all duration-200 shadow-sm text-xs font-mono group"
        title="Select Cyberpunk / Akira Neon Palette"
      >
        <span 
          className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse shrink-0" 
          style={{ backgroundColor: currentTheme.primaryColor, boxShadow: `0 0 8px ${currentTheme.primaryColor}` }}
        />
        
        <Palette className="w-3.5 h-3.5 text-[var(--accent-neon)] shrink-0" />
        
        {!compact && (
          <span className="font-bold tracking-tight text-[11px] sm:text-xs">
            {currentTheme.name}
          </span>
        )}

        <ChevronDown className={`w-3 h-3 text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click outside */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-3.5 rounded-xl bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-color)] shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-50 space-y-3 font-mono"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-color)]/60 pb-2">
                <div>
                  <div className="text-[11px] font-bold text-[var(--accent-neon)] tracking-wider uppercase flex items-center gap-1.5">
                    <span>NEO-TOKYO 2088</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--accent-subtle)] border border-[var(--accent-neon)]/30">
                      PALETTES
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">
                    Select cyberpunk visual aesthetic
                  </div>
                </div>
              </div>

              {/* Theme Grid */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {AKIRA_THEMES.map((theme) => {
                  const isSelected = akiraTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-3 transition-all ${
                        isSelected 
                          ? "bg-[var(--accent-subtle)] border border-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-glow)]" 
                          : "hover:bg-[var(--bg-hover)] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span 
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: theme.primaryColor, boxShadow: isSelected ? `0 0 10px ${theme.primaryColor}` : 'none' }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 truncate">
                            <span>{theme.name}</span>
                            <span className="text-[9px] text-[var(--text-tertiary)] font-normal font-sans">
                              {theme.kanji}
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--text-tertiary)] truncate">
                            {theme.tagline}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--accent-neon)] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Modifiers: SFX & CRT Scanlines */}
              <div className="pt-2 border-t border-[var(--border-color)]/60 flex items-center justify-between gap-2 text-[11px]">
                {/* SFX Audio Toggle */}
                <button
                  onClick={() => {
                    toggleSfx();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                    sfxEnabled 
                      ? "bg-[var(--accent-subtle)] border-[var(--accent-neon)]/50 text-[var(--accent-neon)]" 
                      : "border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  }`}
                  title="Toggle Web Audio Cyber SFX (Soundeffekte)"
                >
                  {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 text-[var(--accent-neon)]" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="font-bold text-[10px]">SFX: {sfxEnabled ? "ON" : "OFF"}</span>
                </button>

                {/* CRT Scanline Toggle */}
                <button
                  onClick={() => {
                    toggleScanlines();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                    scanlines 
                      ? "bg-[var(--accent-subtle)] border-[var(--accent-neon)]/50 text-[var(--accent-neon)]" 
                      : "border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  }`}
                  title="Toggle CRT Scanline HUD effect"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span className="font-bold text-[10px]">CRT: {scanlines ? "ON" : "OFF"}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
