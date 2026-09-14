import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Activity, 
  Radio, 
  Sparkles, 
  Sliders, 
  Zap, 
  Layers, 
  X, 
  Cpu, 
  ShieldCheck, 
  RefreshCw,
  Play,
  Square,
  AudioWaveform,
  Minimize2,
  Maximize2,
  Send,
  Headphones,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  liquidAudioEngine, 
  AcousticTelemetry, 
  LIQUID_VOICE_PROFILES, 
  LiquidAudioState,
  VoiceProfile
} from "@/lib/liquidai/LiquidAudioEngine";
import { soundFx } from "@/lib/soundFx";

interface VoiceStreamControllerProps {
  onTranscriptCaptured?: (text: string) => void;
  onDirectSend?: (text: string) => void;
  onClose?: () => void;
  isExpandedDefault?: boolean;
}

export function VoiceStreamController({
  onTranscriptCaptured,
  onDirectSend,
  onClose,
  isExpandedDefault = false
}: VoiceStreamControllerProps) {
  const [telemetry, setTelemetry] = useState<AcousticTelemetry>(liquidAudioEngine.getTelemetry());
  const [currentProfile, setCurrentProfile] = useState<VoiceProfile>(liquidAudioEngine.getVoiceProfile());
  const [isDuplex, setIsDuplex] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedDefault);
  const [interimText, setInterimText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"dsp" | "profiles" | "synthesis">("dsp");
  const [micPermission, setMicPermission] = useState<"granted" | "prompt" | "denied" | "unknown">("unknown");
  const [ttsInput, setTtsInput] = useState<string>("Liquid LFM-Audio neuronale Synthese betriebsbereit.");
  const [customPitch, setCustomPitch] = useState<number>(currentProfile.pitchMultiplier);
  const [customRate, setCustomRate] = useState<number>(currentProfile.rateMultiplier);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check microphone permissions
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          setMicPermission(permissionStatus.state as any);
          permissionStatus.onchange = () => {
            setMicPermission(permissionStatus.state as any);
          };
        })
        .catch(() => {
          setMicPermission("unknown");
        });
    }
  }, []);

  // Subscribe to LiquidAudioEngine events
  useEffect(() => {
    const unsubTelemetry = liquidAudioEngine.onTelemetry((t) => {
      setTelemetry(t);
    });

    const unsubTranscript = liquidAudioEngine.onTranscript((text, isFinal) => {
      if (isFinal) {
        setInterimText("");
        if (onTranscriptCaptured) {
          onTranscriptCaptured(text);
        }
      } else {
        setInterimText(text);
      }
    });

    const unsubWaveform = liquidAudioEngine.onWaveform((timeDomain, frequency) => {
      renderWaveformCanvas(timeDomain, frequency);
    });

    return () => {
      unsubTelemetry();
      unsubTranscript();
      unsubWaveform();
    };
  }, [onTranscriptCaptured]);

  // Render Real-time Oscilloscope & Spectral FFT on canvas
  const renderWaveformCanvas = (timeDomain: Uint8Array, frequency: Uint8Array) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 1. Grid lines
    ctx.strokeStyle = "rgba(0, 255, 157, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // 2. FFT Bars
    const barCount = 32;
    const barWidth = width / barCount;
    for (let i = 0; i < barCount; i++) {
      const val = frequency[i * 3] || 0;
      const barHeight = (val / 255) * (height * 0.7);
      
      const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
      grad.addColorStop(0, "rgba(16, 185, 129, 0.15)");
      grad.addColorStop(1, "rgba(6, 182, 212, 0.6)");

      ctx.fillStyle = grad;
      ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
    }

    // 3. Oscilloscope Time-Domain Wave
    ctx.lineWidth = 2;
    ctx.strokeStyle = telemetry.vadActive ? "#00ff9d" : "#06b6d4";
    ctx.shadowBlur = telemetry.vadActive ? 8 : 4;
    ctx.shadowColor = telemetry.vadActive ? "#00ff9d" : "#06b6d4";
    ctx.beginPath();

    const sliceWidth = width / timeDomain.length;
    let x = 0;

    for (let i = 0; i < timeDomain.length; i++) {
      const v = timeDomain[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  // Actions
  const handleToggleStream = async () => {
    soundFx.playClick();
    if (telemetry.state === "idle" || telemetry.state === "error") {
      const success = await liquidAudioEngine.startVocalCapture(isDuplex);
      if (success) {
        setMicPermission("granted");
      }
    } else {
      liquidAudioEngine.stopVocalCapture();
    }
  };

  const handleToggleDuplex = () => {
    soundFx.playClick();
    const nextDuplex = !isDuplex;
    setIsDuplex(nextDuplex);
    if (telemetry.state === "listening") {
      liquidAudioEngine.stopVocalCapture();
      liquidAudioEngine.startVocalCapture(nextDuplex);
    }
  };

  const handleSelectProfile = (profile: VoiceProfile) => {
    soundFx.playClick();
    liquidAudioEngine.setVoiceProfile(profile.id);
    setCurrentProfile(profile);
    setCustomPitch(profile.pitchMultiplier);
    setCustomRate(profile.rateMultiplier);
  };

  const handleSynthesizeText = () => {
    if (!ttsInput.trim()) return;
    soundFx.playClick();
    liquidAudioEngine.speakText(ttsInput);
  };

  const handleStopSynthesis = () => {
    soundFx.playClick();
    liquidAudioEngine.interruptSpeechSynthesis();
  };

  const isCapturing = telemetry.state === "listening" || telemetry.state === "processing";
  const isSpeaking = telemetry.state === "synthesizing" || telemetry.state === "speaking";

  return (
    <div className="w-full bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl font-mono text-xs transition-all">
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 bg-[var(--bg-sidebar)]/80 border-b border-[var(--border-color)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border transition ${
            isCapturing 
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse"
              : isSpeaking
              ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)] animate-pulse"
              : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-tertiary)]"
          }`}>
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)] text-xs">
                LIQUID LFM-AUDIO CONTROLLER
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                telemetry.state === "listening"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : telemetry.state === "speaking" || telemetry.state === "synthesizing"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : telemetry.state === "processing"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-black/20 text-[var(--text-tertiary)] border border-[var(--border-color)]"
              }`}>
                {telemetry.state}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-2">
              <span>MIC: {micPermission.toUpperCase()}</span>
              <span>•</span>
              <span>DSP LATENZ: {telemetry.latencyMs}ms</span>
              <span>•</span>
              <span>PROFIL: {currentProfile.name.split(" ")[1]}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Main Stream Toggle Button */}
          <button
            onClick={handleToggleStream}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm ${
              isCapturing
                ? "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            }`}
          >
            {isCapturing ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>STOP DSP</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>START VOCAL STREAM</span>
              </>
            )}
          </button>

          {/* Duplex Mode Switch */}
          <button
            onClick={handleToggleDuplex}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
              isDuplex
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title="Bi-direktionaler Duplex-Modus (Autonome Sprachinteraktion & Barge-in)"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>DUPLEX: {isDuplex ? "ON" : "OFF"}</span>
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title={isExpanded ? "Controller minimieren" : "DSP Telemetrie & Profile maximieren"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-rose-500/20 text-[var(--text-tertiary)] hover:text-rose-400 transition"
              title="Schließen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Oscilloscope & VAD Gauge Bar */}
      <div className="p-3 bg-[var(--bg-main)]/80 border-b border-[var(--border-color)] flex flex-col md:flex-row items-center gap-3">
        {/* Canvas Visualizer */}
        <div className="relative w-full md:w-2/3 h-16 bg-black/40 rounded-xl border border-[var(--border-color)] overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={480}
            height={64}
            className="w-full h-full object-cover"
          />
          {!isCapturing && !isSpeaking && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[var(--text-tertiary)] font-mono">
              [ DSP AUDIO PIPELINE STANDBY - CLICK START TO ENGAGE ]
            </div>
          )}
        </div>

        {/* Live VAD & Acoustic Telemetry Strip */}
        <div className="w-full md:w-1/3 grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between">
            <span className="text-[var(--text-tertiary)] font-bold">VAD ACTIVITY</span>
            <div className="flex items-center justify-between">
              <span className={`font-bold ${telemetry.vadActive ? "text-emerald-400 animate-pulse" : "text-[var(--text-tertiary)]"}`}>
                {telemetry.vadActive ? "VOICE ACTIVE" : "SILENT"}
              </span>
              <span className="text-[var(--text-secondary)]">{Math.round(telemetry.vadConfidence * 100)}%</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between">
            <span className="text-[var(--text-tertiary)] font-bold">ENERGY / PITCH</span>
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold">{telemetry.volumeDb} dB</span>
              <span className="text-purple-400 font-bold">{telemetry.pitchHz > 0 ? `${telemetry.pitchHz} Hz` : "--"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Interim Transcript Strip */}
      {interimText && (
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
            <span className="text-[var(--text-tertiary)] font-bold shrink-0">ERFASST:</span>
            <span className="text-[var(--text-primary)] font-bold italic truncate">"{interimText}"</span>
          </div>

          {onDirectSend && (
            <button
              onClick={() => onDirectSend(interimText)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] flex items-center gap-1 shrink-0 shadow"
            >
              <Send className="w-3 h-3" />
              <span>DIREKT SENDEN</span>
            </button>
          )}
        </div>
      )}

      {/* Expanded Panel: DSP Tabs, Voice Profiles, Neural TTS Synthesizer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border-color)] overflow-hidden"
          >
            {/* Tabs Header */}
            <div className="px-4 pt-3 flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/40">
              {[
                { id: "dsp", label: "DSP-Filter & Pipeline", icon: Sliders },
                { id: "profiles", label: "LFM-Stimmprofile", icon: AudioWaveform },
                { id: "synthesis", label: "Neuronale Synthese (TTS)", icon: Volume2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab(tab.id as any);
                  }}
                  className={`px-3 py-2 border-b-2 text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-4 bg-[var(--bg-card)]">
              {activeTab === "dsp" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
                    <div className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">1. High-Pass Filter</div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">80 Hz (0.7 Q Butterworth)</div>
                    <p className="text-[10px] text-[var(--text-tertiary)]">Filtert Sub-Bass Rumpeln und mechanische Vibrationen.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
                    <div className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">2. Low-Pass Bandpass</div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">7,800 Hz Vocal Focus</div>
                    <p className="text-[10px] text-[var(--text-tertiary)]">Fokussiert das Spektrum auf die primären Formanten der menschlichen Stimme.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
                    <div className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">3. Studio Dynamics Compressor</div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">-24 dB Thresh (4:1 Ratio)</div>
                    <p className="text-[10px] text-[var(--text-tertiary)]">Verhindert Clipping und normalisiert Dynamikschwankungen in Echtzeit.</p>
                  </div>
                </div>
              )}

              {activeTab === "profiles" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {LIQUID_VOICE_PROFILES.map((profile) => (
                      <div
                        key={profile.id}
                        onClick={() => handleSelectProfile(profile)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                          currentProfile.id === profile.id
                            ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                            : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--text-secondary)]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[var(--text-primary)]">{profile.name}</span>
                            {currentProfile.id === profile.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{profile.description}</p>
                        </div>

                        <div className="text-[9px] font-mono text-[var(--text-tertiary)] flex items-center justify-between border-t border-[var(--border-color)] pt-1.5">
                          <span>Pitch: {profile.pitchMultiplier}x</span>
                          <span>Rate: {profile.rateMultiplier}x</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "synthesis" && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={ttsInput}
                      onChange={(e) => setTtsInput(e.target.value)}
                      placeholder="Text für LFM-Audio kontinuierliche Synthese eingeben..."
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleSynthesizeText}
                        disabled={isSpeaking}
                        className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-1.5 transition shadow disabled:opacity-50 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>SYNTHETISIEREN</span>
                      </button>
                      {isSpeaking && (
                        <button
                          onClick={handleStopSynthesis}
                          className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 text-xs font-bold flex items-center gap-1 shrink-0"
                        >
                          <Square className="w-3 h-3" />
                          <span>STOP</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
