import { useState } from "react";
import { Shield, Database, Radio, Sparkles, Volume2, VolumeX, Tv, RefreshCw, Flame, Sliders, Check, Power, Zap, Eye } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import { webrtcConnectionManager } from "@/lib/WebRTCConnectionManager";
import { useMuscalStore } from "@/store/useMuscalStore";
import { soundFx } from "@/lib/soundFx";
import { AKIRA_THEMES, AkiraThemeId } from "@/lib/themeEngine";
import { motion } from "motion/react";

export function Settings() {
  const localDeviceId = webrtcConnectionManager.getLocalDeviceId();
  const { 
    akiraTheme, 
    setAkiraTheme, 
    scanlines, 
    toggleScanlines, 
    sfxEnabled, 
    toggleSfx, 
    sidebarWidth, 
    setSidebarWidth,
    chatListWidth,
    setChatListWidth,
    focusMode,
    toggleFocusMode,
    triggerSystemBoot
  } = useMuscalStore();

  const [testSoundMsg, setTestSoundMsg] = useState("");

  const playTest = (type: string, fn: () => void) => {
    fn();
    setTestSoundMsg(`Triggered: ${type}`);
    setTimeout(() => setTestSoundMsg(""), 1500);
  };

  const handleResetLayout = () => {
    soundFx.playConfirm();
    setSidebarWidth(280);
    setChatListWidth(320);
    setTestSoundMsg("Panels reset to default widths (280px / 320px)");
    setTimeout(() => setTestSoundMsg(""), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 text-[var(--text-primary)] transition-colors h-full overflow-y-auto font-sans"
    >
      <header className="border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-neon)] uppercase tracking-wider mb-1">
          <Flame className="w-4 h-4 fill-current animate-pulse" />
          <span>NEO-TOKYO SYSTEM CONFIG // 2088</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">SETTINGS & THEMES</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
          Customize Akira cyberpunk aesthetic palettes, Web Audio SFX synthesis, draggable panel dimensions, and audit logs.
        </p>
      </header>

      <div className="space-y-8">
        {/* Akira Cyberpunk Visual Themes Gallery */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-neon)] font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Cyberpunk Theme Matrix</span>
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
              ACTIVE: {akiraTheme.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AKIRA_THEMES.map((th) => {
              const isActive = akiraTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => {
                    setAkiraTheme(th.id);
                    soundFx.playThemeSwitch();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-28 relative overflow-hidden group ${
                    isActive
                      ? "border-[var(--accent-neon)] bg-[var(--accent-subtle)] shadow-[0_0_16px_var(--accent-glow)]"
                      : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-neon)]/60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: th.primaryColor }}
                    />
                    {isActive && (
                      <Check className="w-4 h-4 text-[var(--accent-neon)]" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-extrabold font-mono text-[var(--text-primary)] truncate">
                      {th.name}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
                      {th.kanji}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Audio Synthesizer (SFX) & CRT FX */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-neon)] font-mono flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span>Sound Effects & Visual FX</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* SFX Synthesizer Engine Card */}
            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--accent-neon)] rounded-xl">
                    {sfxEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-zinc-500" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-mono">Cyber WebAudio SFX</h3>
                    <p className="text-xs text-[var(--text-tertiary)] font-mono">
                      Pure synthesized audio feedback on clicks, sends, mic & routing
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleSfx()}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
                    sfxEnabled
                      ? "bg-[var(--accent-neon)] text-black border-[var(--accent-neon)] shadow-[0_0_10px_var(--accent-glow)]"
                      : "bg-[var(--bg-main)] text-[var(--text-tertiary)] border-[var(--border-color)]"
                  }`}
                >
                  {sfxEnabled ? "ENABLED" : "MUTED"}
                </button>
              </div>

              {/* Sound Test Triggers */}
              <div className="space-y-2 border-t border-[var(--border-color)] pt-3">
                <div className="text-[11px] font-mono text-[var(--text-secondary)]">Test Synthesizer Waves:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => playTest("Click (1.2kHz)", () => soundFx.playClick())}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--bg-main)] hover:border-[var(--accent-neon)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    Click
                  </button>
                  <button
                    onClick={() => playTest("Confirm Arpeggio", () => soundFx.playConfirm())}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--bg-main)] hover:border-[var(--accent-neon)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => playTest("Send Laser", () => soundFx.playSend())}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--bg-main)] hover:border-[var(--accent-neon)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => playTest("Cyber Alert", () => soundFx.playAlert())}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--bg-main)] hover:border-rose-500 border border-[var(--border-color)] text-rose-400"
                  >
                    Alert
                  </button>
                </div>
                {testSoundMsg && (
                  <p className="text-[10px] font-mono text-[var(--accent-neon)] animate-fade-in">{testSoundMsg}</p>
                )}
              </div>
            </div>

            {/* CRT Scanline & Retro Shaders */}
            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--accent-neon)] rounded-xl">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-mono">CRT Scanline Overlay</h3>
                    <p className="text-xs text-[var(--text-tertiary)] font-mono">
                      Subtle horizontal raster scanlines & animated cyber flicker
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleScanlines()}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
                    scanlines
                      ? "bg-[var(--accent-neon)] text-black border-[var(--accent-neon)] shadow-[0_0_10px_var(--accent-glow)]"
                      : "bg-[var(--bg-main)] text-[var(--text-tertiary)] border-[var(--border-color)]"
                  }`}
                >
                  {scanlines ? "ACTIVE" : "OFF"}
                </button>
              </div>

              {/* Draggable Panels Info & Reset */}
              <div className="space-y-2 border-t border-[var(--border-color)] pt-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-secondary)]">Sidebar Width:</span>
                  <span className="text-[var(--accent-neon)] font-bold">{sidebarWidth}px</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-secondary)]">Chat Column Width:</span>
                  <span className="text-[var(--accent-neon)] font-bold">{chatListWidth}px</span>
                </div>
                <button
                  onClick={handleResetLayout}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-neon)] bg-[var(--bg-main)] text-xs font-mono font-bold text-[var(--text-primary)] transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-neon)]" />
                  <span>RESET PANEL WIDTHS</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* System Boot & Focus Mode Controls */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-neon)] font-mono flex items-center gap-2">
            <Power className="w-4 h-4 text-[var(--accent-neon)]" />
            <span>Futuristic System Boot & Modul-Fokus</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Boot Dashboard Card */}
            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--accent-neon)] rounded-xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-mono">System-Start Dashboard</h3>
                    <p className="text-xs text-[var(--text-tertiary)] font-mono">
                      Futuristisches Hochfahren & Live-Visualisierung aller Module
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => triggerSystemBoot()}
                  className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-[var(--accent-neon)] text-black shadow-[0_0_12px_var(--accent-glow)] hover:brightness-110 transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>HOCHFAHREN</span>
                </button>
              </div>
              <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                Führt die vollständige kryptografische Initialisierungs-Matrix, Speicherprüfung und Netzwerk-Latenzmessung erneut aus.
              </p>
            </div>

            {/* Focus Mode Card */}
            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] text-indigo-400 rounded-xl">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-mono">Modul-Fokus (Zen-Modus)</h3>
                    <p className="text-xs text-[var(--text-tertiary)] font-mono">
                      Blendet alle nicht relevanten Bereiche aus
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleFocusMode()}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
                    focusMode
                      ? "bg-[var(--accent-neon)] text-black border-[var(--accent-neon)] shadow-[0_0_10px_var(--accent-glow)]"
                      : "bg-[var(--bg-main)] text-[var(--text-tertiary)] border-[var(--border-color)]"
                  }`}
                >
                  {focusMode ? "FOKUS AKTIV" : "STANDARD"}
                </button>
              </div>
              <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                Im Fokus-Modus verkleinert sich die Seitenleiste automatisch zu einer minimalistischen Icon-Leiste und konzentriert 100% des Bildschirms auf das aktive Modul.
              </p>
            </div>
          </div>
        </section>

        {/* Local Node Telemetry */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-neon)] font-mono flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span>Local Node & WebRTC Telemetry</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--accent-neon)] rounded-xl">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs font-mono text-[var(--text-primary)]">LOCAL NODE SIGNALING ID</h3>
                  <p className="text-xs text-[var(--accent-neon)] mt-1 font-mono break-all font-bold">{localDeviceId}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1 font-mono">Firestore signaling channel: signals/{localDeviceId}</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[var(--bg-main)] border border-[var(--border-color)] text-indigo-400 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs font-mono text-[var(--text-primary)]">FIRESTORE RAG SYNCHRONIZATION</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Collection: rag_sources active</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1 font-mono">Cross-device live state broadcasting active</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Audit Log Viewer Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-neon)] font-mono flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Real-time System Audit Trail</span>
            </h2>
          </div>
          
          <AuditLogViewer maxHeight="460px" />
        </section>
      </div>
    </motion.div>
  );
}
