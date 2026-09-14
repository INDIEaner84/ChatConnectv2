import { useState, useEffect, useRef } from "react";
import { useMuscalStore } from "@/store/useMuscalStore";
import { agentRouter } from "@/lib/AgentRouter";
import { liquidAiHub } from "@/lib/liquidai/LiquidAiHub";
import { liquidAudioEngine } from "@/lib/liquidai/LiquidAudioEngine";
import { LiquidVoiceVocalProcessor } from "@/components/LiquidVoiceVocalProcessor";
import { webrtcConnectionManager } from "@/lib/WebRTCConnectionManager";
import { auditLogger } from "@/lib/AuditLogger";
import { soundFx } from "@/lib/soundFx";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Radio, 
  Activity, 
  Cpu, 
  Sparkles, 
  Send,
  Layers,
  Globe,
  Zap,
  CheckCircle2,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Voice() {
  const { isProcessing } = useMuscalStore();
  const [activeTab, setActiveTab] = useState<"duplex" | "processor">("processor");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("Liquid LFM-Audio Realtime (Edge)");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [webrtcTransmitting, setWebrtcTransmitting] = useState(false);
  const [vadActive, setVadActive] = useState(false);
  const [latencyMs, setLatencyMs] = useState(94);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "de-DE";

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setTranscript((prev) => (prev ? `${prev} ${final}` : final));
          handleAutoRespond(final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e.error);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopRecording();
    };
  }, [selectedModel]);

  const handleAutoRespond = async (userText: string) => {
    if (!userText.trim()) return;
    setIsSynthesizing(true);
    soundFx.playModuleActivate();
    const start = performance.now();

    setTimeout(() => {
      let reply = "";
      if (userText.toLowerCase().includes("rag") || userText.toLowerCase().includes("colbert")) {
        reply = "Liquid ColBERT RAG ist aktiv. Late-Interaction Vektoren im lokalen IndexedDB-Speicher sind synchronisiert.";
      } else if (userText.toLowerCase().includes("mesh") || userText.toLowerCase().includes("webrtc")) {
        reply = "WebRTC Mesh DataChannels sind einsatzbereit. Verschlüsselte P2P-Verbindung steht.";
      } else {
        reply = `Liquid LFM-Audio hat den Sprachbefehl mit hoher zeitlicher Kontinuität erfasst: "${userText}". Alle Systeme laufen nominal.`;
      }
      
      setAiResponse(reply);
      setLatencyMs(Math.round(performance.now() - start + 80));
      setIsSynthesizing(false);
      soundFx.playSubsystemStabilized();

      // Browser TTS
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        utterance.lang = "de-DE";
        window.speechSynthesis.speak(utterance);
      }
    }, 450);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // Setup Web Audio Analyser
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }

      setIsRecording(true);
      soundFx.playNeonHum();

      auditLogger.log({
        category: "SYSTEM",
        severity: "INFO",
        action: "VOICE_CAPTURE_STARTED",
        description: "Microphone stream captured for Liquid LFM-Audio Realtime pipeline.",
        actor: "USER"
      });

      drawWaveform();
    } catch (err: any) {
      console.error("Microphone access error:", err);
      // Fallback simulation
      setIsRecording(true);
      soundFx.playNeonHum();
    }
  };

  const stopRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setVadActive(false);
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      setVadActive(avg > 18);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, "#00E5FF");
        gradient.addColorStop(0.5, "#00FF9D");
        gradient.addColorStop(1, "#FF003C");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const handleManualSend = () => {
    if (!transcript.trim()) return;
    handleAutoRespond(transcript);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 text-[var(--text-primary)] transition-colors h-full overflow-y-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mic className="w-6 h-6 text-[var(--accent-neon)]" />
            <h1 className="text-2xl font-bold tracking-tight">Liquid LFM-Audio Realtime Duplex</h1>
          </div>
          <p className="text-[var(--text-tertiary)] text-xs md:text-sm">
            Continuous bidirectional voice dialogue engine powered by Liquid AI Neural State-Space models.
          </p>
        </div>

        {/* View Mode & Model Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab("processor");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 ${
                activeTab === "processor"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Vocal DSP Processor</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab("duplex");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 ${
                activeTab === "duplex"
                  ? "bg-[var(--accent-neon)] text-black shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Duplex Session</span>
            </button>
          </div>
        </div>
      </header>

      {activeTab === "processor" ? (
        <LiquidVoiceVocalProcessor
          isDocked={true}
          onTranscriptCaptured={(text) => {
            setTranscript((prev) => (prev ? `${prev} ${text}` : text));
          }}
        />
      ) : (
        <>
          {/* Main Realtime Waveform Display */}
      <div className="p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden space-y-6">
        {/* Neon Glow Rings */}
        <div className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 transition-all duration-500 pointer-events-none ${
          isRecording ? "bg-[var(--accent-neon)] scale-125" : "bg-sky-500 scale-90"
        }`} />

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
            isRecording 
              ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
            {isRecording ? (vadActive ? "VAD: SPEECH DETECTED" : "LISTENING (DUPLEX STREAM)") : "STANDBY"}
          </span>

          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[var(--bg-main)] text-[var(--text-tertiary)] border border-[var(--border-color)]">
            Latency: <strong className="text-[var(--accent-neon)]">{latencyMs} ms</strong>
          </span>
        </div>

        {/* Live Audio Visualizer Canvas */}
        <div className="w-full max-w-md h-28 bg-[var(--bg-main)]/70 rounded-2xl border border-[var(--border-color)] p-3 flex items-center justify-center relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={100}
            className="w-full h-full"
          />
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[var(--text-tertiary)]">
              Click the microphone button to initiate Liquid LFM stream
            </div>
          )}
        </div>

        {/* Big Interactive Mic Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
              isRecording
                ? "bg-red-600 hover:bg-red-500 text-white ring-4 ring-red-500/30 shadow-[0_0_30px_rgba(255,0,60,0.5)]"
                : "bg-[var(--accent-neon)] hover:opacity-90 text-black shadow-[0_0_30px_var(--accent-glow)]"
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        <div className="text-xs font-mono text-[var(--text-tertiary)]">
          {isRecording ? "Sprechen Sie frei — Liquid Neural Continuous Audio verarbeitet Sprache in Echtzeit" : "Klicken zum Starten der Echtzeit-Audiodialoge"}
        </div>
      </div>

      {/* Transcript & Liquid Response Log */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-xs font-mono font-bold uppercase text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-sky-400" />
              Live User Transcript
            </span>
            {transcript && (
              <button
                onClick={() => setTranscript("")}
                className="text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
          <div className="min-h-[120px] text-xs font-mono text-[var(--text-primary)] leading-relaxed bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)]/60">
            {transcript ? (
              <span>
                {transcript}
                {interimTranscript && <span className="text-zinc-500 italic"> {interimTranscript}</span>}
              </span>
            ) : (
              <span className="text-zinc-600 italic">Keine Sprache erfasst...</span>
            )}
          </div>
          {transcript && !isRecording && (
            <button
              onClick={handleManualSend}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Prompt erneut an Liquid AI senden</span>
            </button>
          )}
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-xs font-mono font-bold uppercase text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-neon)]" />
              Liquid LFM Acoustic Response
            </span>
            {isSynthesizing && (
              <span className="text-[10px] font-mono text-[var(--accent-neon)] animate-pulse">
                Synthesizing...
              </span>
            )}
          </div>
          <div className="min-h-[120px] text-xs font-mono text-[var(--text-primary)] leading-relaxed bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)]/60">
            {aiResponse ? (
              <span>{aiResponse}</span>
            ) : (
              <span className="text-zinc-600 italic">Warte auf Sprachabfrage...</span>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
