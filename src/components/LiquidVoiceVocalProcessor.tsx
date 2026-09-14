import { useState, useEffect, useRef } from "react";
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
  Square
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  liquidAudioEngine, 
  AcousticTelemetry, 
  LIQUID_VOICE_PROFILES, 
  LiquidAudioState 
} from "@/lib/liquidai/LiquidAudioEngine";
import { soundFx } from "@/lib/soundFx";

interface LiquidVoiceVocalProcessorProps {
  onTranscriptCaptured?: (text: string) => void;
  onClose?: () => void;
  isDocked?: boolean;
}

export function LiquidVoiceVocalProcessor({
  onTranscriptCaptured,
  onClose,
  isDocked = false
}: LiquidVoiceVocalProcessorProps) {
  const [telemetry, setTelemetry] = useState<AcousticTelemetry>(liquidAudioEngine.getTelemetry());
  const [selectedProfileId, setSelectedProfileId] = useState<string>(liquidAudioEngine.getVoiceProfile().id);
  const [isDuplex, setIsDuplex] = useState<boolean>(false);
  const [interimText, setInterimText] = useState<string>("");
  const [testSpeechInput, setTestSpeechInput] = useState<string>("Liquid LFM-Audio kontinuierliche neuronale Synthese initialisiert.");
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"visualizer" | "profiles" | "telemetry">("visualizer");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const unsubState = liquidAudioEngine.onStateChange((state) => {
      setIsSynthesizing(state === "synthesizing" || state === "speaking");
    });

    return () => {
      unsubTelemetry();
      unsubTranscript();
      unsubWaveform();
      unsubState();
    };
  }, [onTranscriptCaptured]);

  const renderWaveformCanvas = (timeDomain: Uint8Array, frequency: Uint8Array) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = "rgba(0, 255, 157, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw FFT Spectrum Bars in background
    const barWidth = (width / frequency.length) * 2.5;
    let x = 0;
    for (let i = 0; i < frequency.length / 2; i++) {
      const barHeight = (frequency[i] / 255) * (height * 0.7);
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, "rgba(168, 85, 247, 0.15)");
      gradient.addColorStop(1, "rgba(0, 255, 157, 0.4)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }

    // Draw Oscilloscope Waveform line
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = telemetry.vadActive ? "#00ff9d" : "#a855f7";
    ctx.shadowColor = telemetry.vadActive ? "rgba(0, 255, 157, 0.6)" : "rgba(168, 85, 247, 0.4)";
    ctx.shadowBlur = 8;
    ctx.beginPath();

    const sliceWidth = width / timeDomain.length;
    let waveX = 0;

    for (let i = 0; i < timeDomain.length; i++) {
      const v = timeDomain[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(waveX, y);
      } else {
        ctx.lineTo(waveX, y);
      }
      waveX += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
  };

  const handleToggleVocalCapture = async () => {
    if (telemetry.state === "listening" || telemetry.state === "processing") {
      soundFx.playClick();
      liquidAudioEngine.stopVocalCapture();
    } else {
      soundFx.playModuleActivate();
      await liquidAudioEngine.startVocalCapture(isDuplex);
    }
  };

  const handleVoiceProfileChange = (profileId: string) => {
    soundFx.playClick();
    setSelectedProfileId(profileId);
    liquidAudioEngine.setVoiceProfile(profileId);
  };

  const handleTestSpeech = async () => {
    if (!testSpeechInput.trim()) return;
    soundFx.playClick();
    await liquidAudioEngine.speakText(testSpeechInput);
  };

  const handleStopSpeech = () => {
    soundFx.playClick();
    liquidAudioEngine.interruptSpeechSynthesis();
  };

  const isActive = telemetry.state === "listening" || telemetry.state === "processing" || telemetry.state === "speaking";

  return (
    <div className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden font-mono text-[var(--text-primary)] ${
      isDocked ? "w-full" : "max-w-2xl w-full mx-auto"
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)]/50">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border transition-all ${
            isActive 
              ? "bg-[var(--accent-subtle)] text-[var(--accent-neon)] border-[var(--accent-neon)]/50 shadow-[0_0_15px_var(--accent-glow)] animate-pulse" 
              : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)]"
          }`}>
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-neon)] via-purple-400 to-indigo-400">
                Liquid LFM-Audio DSP Engine
              </h3>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
              }`}>
                {telemetry.state}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1.5 mt-0.5">
              <span>WebAudio Realtime DSP</span>
              <span>•</span>
              <span>Continuous Neural SSM</span>
              <span>•</span>
              <span className="text-[var(--accent-neon)]">~{telemetry.latencyMs}ms Latency</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Duplex Toggle Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              const next = !isDuplex;
              setIsDuplex(next);
              if (isActive) {
                liquidAudioEngine.stopVocalCapture();
                liquidAudioEngine.startVocalCapture(next);
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1.5 ${
              isDuplex 
                ? "bg-purple-600 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-neon)]"
            }`}
            title="Duplex Mode: Bidirectional turn-taking speech AI"
          >
            <Zap className="w-3 h-3" />
            <span>DUPLEX {isDuplex ? "ON" : "OFF"}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[var(--border-color)] px-4 bg-[var(--bg-sidebar)]/30 text-xs font-bold">
        {[
          { id: "visualizer", label: "Oscilloscope & VAD", icon: Activity },
          { id: "profiles", label: "Voice Profiles & Synthesis", icon: Volume2 },
          { id: "telemetry", label: "DSP Telemetry", icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition -mb-px text-[11px] ${
                activeTab === tab.id
                  ? "border-[var(--accent-neon)] text-[var(--accent-neon)]"
                  : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        {activeTab === "visualizer" && (
          <div className="space-y-3">
            {/* Waveform Canvas */}
            <div className="relative rounded-xl border border-[var(--border-color)] bg-black/40 overflow-hidden h-32 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={560}
                height={128}
                className="w-full h-full block"
              />

              {!isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] text-center p-4">
                  <Activity className="w-6 h-6 text-[var(--accent-neon)]/60 mb-1" />
                  <span className="text-xs text-[var(--text-secondary)] font-bold">
                    WebAudio DSP Standby
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    Klicke auf "Mikrofon aktivieren" um das Echtzeit-Audio-Routing zu starten.
                  </span>
                </div>
              )}

              {/* Live Overlay Metrics */}
              {isActive && (
                <div className="absolute top-2 right-2 flex items-center gap-2 text-[9px] font-mono">
                  <span className={`px-2 py-0.5 rounded border ${
                    telemetry.vadActive 
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse" 
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}>
                    VAD: {telemetry.vadActive ? "VOICE DETECTED" : "SILENCE"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 border border-[var(--border-color)] text-[var(--accent-neon)]">
                    {telemetry.volumeDb} dB
                  </span>
                </div>
              )}
            </div>

            {/* Interim Transcript Live Display */}
            {interimText && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-neon)]/40 text-xs font-sans text-[var(--text-primary)] italic flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[var(--accent-neon)] shrink-0 animate-spin" />
                <span className="truncate">"{interimText}"</span>
              </motion.div>
            )}

            {/* Main Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleVocalCapture}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg ${
                    isActive
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                      : "bg-[var(--accent-neon)] hover:brightness-110 text-black shadow-[0_0_16px_var(--accent-glow)]"
                  }`}
                >
                  {isActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isActive ? "Audio-Erfassung stoppen" : "Mikrofon aktivieren"}</span>
                </button>

                {isActive && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      liquidAudioEngine.interruptSpeechSynthesis();
                    }}
                    className="px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-rose-500/50 text-xs text-[var(--text-secondary)] hover:text-rose-400 transition flex items-center gap-1.5"
                    title="Barge-In: Unterbreche laufende Audiosynthese"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Barge-In (Stop)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)] font-mono">
                <div>
                  <span className="text-[var(--text-secondary)]">VAD-Confidence: </span>
                  <span className="text-[var(--accent-neon)] font-bold">{Math.round(telemetry.vadConfidence * 100)}%</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Pitch: </span>
                  <span className="text-purple-400 font-bold">{telemetry.pitchHz} Hz</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profiles" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LIQUID_VOICE_PROFILES.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleVoiceProfileChange(profile.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedProfileId === profile.id
                      ? "bg-[var(--accent-subtle)] border-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-glow)]"
                      : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--accent-neon)]/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--accent-neon)] font-bold uppercase">
                        {profile.gender}
                      </span>
                      {selectedProfileId === profile.id && (
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-neon)] shadow-[0_0_6px_var(--accent-neon)]" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">{profile.name}</h4>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1 line-clamp-2">{profile.description}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[9px] text-[var(--text-tertiary)]">
                    <span>Pitch: {profile.pitchMultiplier}x</span>
                    <span>Rate: {profile.rateMultiplier}x</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Test Synthesis Bar */}
            <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)]/60 space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[var(--accent-neon)]" />
                <span>LFM-Audio Synthese-Tester</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testSpeechInput}
                  onChange={(e) => setTestSpeechInput(e.target.value)}
                  placeholder="Text für Sprachausgabe eingeben..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-neon)] font-mono"
                />
                {isSynthesizing ? (
                  <button
                    onClick={handleStopSpeech}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={handleTestSpeech}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Sprechen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "telemetry" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pipeline Latency", value: `${telemetry.latencyMs} ms`, color: "var(--accent-neon)" },
              { label: "Acoustic Energy", value: `${telemetry.volumeDb} dB`, color: "#a855f7" },
              { label: "Pitch Tracking", value: `${telemetry.pitchHz} Hz`, color: "#38bdf8" },
              { label: "Neural ODE State", value: `${telemetry.continuousOdeState}%`, color: "#34d399" },
              { label: "VAD Confidence", value: `${Math.round(telemetry.vadConfidence * 100)}%`, color: "var(--accent-neon)" },
              { label: "Spectral Centroid", value: `${telemetry.spectralCentroid} Hz`, color: "#a855f7" },
              { label: "Duplex Turn-Taking", value: isDuplex ? "ACTIVE" : "STANDBY", color: isDuplex ? "#34d399" : "#94a3b8" },
              { label: "Audio Graph", value: "44.1 kHz / 24-bit", color: "#38bdf8" }
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]">
                <div className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{stat.label}</div>
                <div className="text-sm font-black font-mono mt-1" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
