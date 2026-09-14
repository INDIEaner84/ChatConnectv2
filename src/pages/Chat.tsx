import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { conversationService } from "@/messaging/ConversationService";
import { identityService } from "@/identity/IdentityService";
import { relationshipRepository } from "@/storage/repositories/RelationshipRepository";
import { contactRepository } from "@/storage/repositories/ContactRepository";
import { syncService } from "@/sync/SyncService";
import { ConversationEntity, MessageEntity, ContactEntity, RelationshipEntity } from "@/storage/types";
import { eventBus, AppEvents } from "@/core/events/EventBus";
import { useMuscalStore } from "@/store/useMuscalStore";
import { ResizeHandle } from "@/components/ui/ResizeHandle";
import { soundFx } from "@/lib/soundFx";
import { nicknameEngine } from "@/lib/nicknameEngine";
import { liquidAiHub } from "@/lib/liquidai/LiquidAiHub";
import { liquidAudioEngine } from "@/lib/liquidai/LiquidAudioEngine";
import { LiquidVoiceVocalProcessor } from "@/components/LiquidVoiceVocalProcessor";
import { VoiceStreamController } from "@/components/VoiceStreamController";
import { 
  Send, 
  Paperclip, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  Users, 
  User, 
  Plus, 
  ShieldCheck, 
  MessageSquare, 
  FileText, 
  Mic, 
  MicOff, 
  Volume2,
  VolumeX,
  ChevronLeft, 
  Search, 
  Sparkles,
  Terminal,
  Flame,
  Radio,
  Brain,
  Dna,
  FolderSync,
  MonitorSmartphone,
  Activity,
  ArrowRight,
  PanelLeftClose,
  PanelLeft,
  Zap,
  HelpCircle,
  Cpu,
  Globe,
  Folder,
  Layers,
  Database,
  SearchCode,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SmartChoice {
  id: string;
  category: 'cognitive' | 'design' | 'research' | 'security' | 'mesh';
  title: string;
  prompt: string;
  badge: string;
  icon: React.ElementType;
  route?: string;
}

const SMART_CHOICES: SmartChoice[] = [
  {
    id: "cog-1",
    category: "cognitive",
    title: "Kognitionsraum & Kausalgraph",
    prompt: "Erkläre mir die 8 Phasen des kognitiven Lebenszyklus von Muscal OS und visualisiere die Dialektik.",
    badge: "COGNITIVE OS",
    icon: Brain,
    route: "/cognitive-os"
  },
  {
    id: "des-1",
    category: "design",
    title: "Design Evolution Lab",
    prompt: "Erforsche die 4 evolutionären UI-Paradigmen und züchte einen neuen N+1 Hybrid-Prototyp.",
    badge: "GENETIC UI",
    icon: Dna,
    route: "/design-lab"
  },
  {
    id: "res-1",
    category: "research",
    title: "Autonome Recherche",
    prompt: "Führe eine dezentrale RAG-Recherche über Zero-Knowledge und lokale WebCrypto-Schlüssel durch.",
    badge: "AI RAG",
    icon: Sparkles
  },
  {
    id: "mesh-1",
    category: "mesh",
    title: "P2P Mesh & Speicher-Sync",
    prompt: "Überprüfe den WebRTC Peer-Mesh Status und synchronisiere die IndexedDB Outbox mit allen Knoten.",
    badge: "P2P DATA",
    icon: FolderSync,
    route: "/files"
  },
  {
    id: "sec-1",
    category: "security",
    title: "Zero-Trust & ECDSA Vault",
    prompt: "Analysiere den Sicherheitsstatus der ECDSA-P256 Schlüsselpaare und führe die 24 Chaos-Gates aus.",
    badge: "SECURITY",
    icon: ShieldCheck,
    route: "/diagnostics"
  },
  {
    id: "diag-1",
    category: "security",
    title: "Live-Systemdiagnose",
    prompt: "Zeige mir alle aktiven Telemetrie-Werte, Latenzen und Routing-Strategien in Echtzeit an.",
    badge: "TELEMETRY",
    icon: Activity,
    route: "/diagnostics"
  }
];

export function Chat() {
  const { chatListWidth, setChatListWidth, akiraTheme } = useMuscalStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationEntity[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationEntity | null>(null);
  const [messages, setMessages] = useState<MessageEntity[]>([]);
  const [contacts, setContacts] = useState<ContactEntity[]>([]);
  const [relationships, setRelationships] = useState<RelationshipEntity[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupPeers, setSelectedGroupPeers] = useState<string[]>([]);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [showWebResearchModal, setShowWebResearchModal] = useState(false);
  const [webResearchQuery, setWebResearchQuery] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [showColbertModal, setShowColbertModal] = useState(false);
  const [colbertFileName, setColbertFileName] = useState("");
  const [colbertFileContent, setColbertFileContent] = useState("");
  const [isAnalyzingColbert, setIsAnalyzingColbert] = useState(false);
  const [showLiquidAudioModal, setShowLiquidAudioModal] = useState(false);
  const [showVoiceStreamController, setShowVoiceStreamController] = useState(false);
  const [isVoiceStreamDocked, setIsVoiceStreamDocked] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const handleVoiceStreamDirectSend = async (text: string) => {
    if (!text.trim() || !activeConversation || isSending) return;
    setIsSending(true);
    soundFx.playSend();
    try {
      await conversationService.sendMessage(activeConversation.id, text.trim(), 'text');
      await loadMessages();
      await loadChatData();
    } catch (err) {
      console.error("Voice stream direct send error:", err);
      soundFx.playAlert();
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleSpeakMessage = async (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      soundFx.playClick();
      liquidAudioEngine.interruptSpeechSynthesis();
      setSpeakingMessageId(null);
    } else {
      soundFx.playClick();
      setSpeakingMessageId(msgId);
      await liquidAudioEngine.speakText(text);
      setSpeakingMessageId(null);
    }
  };

  const CHAT_FOLDERS = [
    { id: 'all', label: 'All Channels', icon: MessageSquare, count: conversations.length },
    { id: 'research', label: 'Web Research & KI', icon: Globe, count: conversations.filter(c => c.title?.includes('Research') || c.title?.includes('Analyse')).length },
    { id: 'colbert', label: 'ColBERT & File RAG', icon: Layers, count: conversations.filter(c => c.title?.includes('ColBERT') || c.title?.includes('RAG')).length },
    { id: 'audio', label: 'Liquid Audio Logs', icon: Mic, count: conversations.filter(c => c.title?.includes('Audio') || c.title?.includes('Voice')).length },
    { id: 'security', label: 'Security & Mesh', icon: ShieldCheck, count: conversations.filter(c => c.title?.includes('Security') || c.title?.includes('Gate') || c.type === 'direct').length },
  ];

  const handleRunWebResearch = async () => {
    if (!webResearchQuery.trim() || isResearching) return;
    setIsResearching(true);
    soundFx.playModuleActivate();
    try {
      const research = await liquidAiHub.executeWebResearchTool(webResearchQuery.trim());
      
      // Format markdown response
      const report = `### 🌐 Liquid LFM-Tool // Autonome Web-Recherche: "${webResearchQuery}"\n\n` +
        `*Epistemischer Score:* **${research.epistemicConfidence}%** | *Quellen analysiert:* **${research.sourcesAnalyzed}**\n\n` +
        `#### 📊 Kern-Erkenntnisse & Synthese:\n${research.synthesizedReport}\n\n` +
        `#### 🧠 Key Findings:\n` +
        research.keyFindings.map(k => `- ${k}`).join('\n') +
        `\n\n#### 🔗 Verifizierte Zitate:\n` +
        research.citations.map(s => `- [${s.title}](${s.url}) (Zuverlässigkeit: ${(s.reliability * 100).toFixed(0)}%)`).join('\n') +
        `\n\n*Abgelegt im Chat-Ordner: "Web Research & KI Analysen"*`;

      // Get or create dedicated Web Research Conversation
      let targetConv = activeConversation;
      if (!targetConv || !targetConv.title?.includes('Research')) {
        targetConv = await conversationService.createGroup(
          `🌐 Research: ${webResearchQuery.substring(0, 24)}`,
          [],
          "Web Research & KI Analysen"
        ).then(res => res.conversation).catch(() => activeConversation);
        if (targetConv) {
          await loadChatData();
          setActiveConversation(targetConv);
        }
      }

      if (targetConv) {
        await conversationService.sendMessage(targetConv.id, report, 'text');
        await loadMessages();
      }

      soundFx.playSubsystemStabilized();
      setShowWebResearchModal(false);
      setWebResearchQuery("");
    } catch (err) {
      console.error("Web research error:", err);
      soundFx.playAlert();
    } finally {
      setIsResearching(false);
    }
  };

  const handleRunColBERTAnalysis = async () => {
    if (!colbertFileName.trim() || isAnalyzingColbert) return;
    setIsAnalyzingColbert(true);
    soundFx.playModuleActivate();
    try {
      const result = await liquidAiHub.analyzeFileWithColBERT(
        colbertFileName.trim(), 
        colbertFileContent || `Multi-vector neural tokens for document ${colbertFileName}`
      );

      const report = `### ⚡ Liquid ColBERT Late-Interaction Analyse: "${colbertFileName}"\n\n` +
        `*Embed-Dimension:* **${result.indexedVectors} Vektoren (MaxSim-Retrieval)** | *Token-Count:* **${result.totalTokens} Tokens**\n\n` +
        `#### 📋 Semantische Zusammenfassung:\n${result.semanticSummary}\n\n` +
        `#### 🧠 Extrahierte Insights & Kausalitäten:\n` +
        result.keyInsights.map(e => `- ${e}`).join('\n') +
        (result.causalAssertions.length > 0 ? `\n\n#### ⚡ Kausale Thesen:\n` + result.causalAssertions.map(c => `- ${c}`).join('\n') : '') +
        `\n\n*ColBERT Indizierung abgeschlossen und im lokalen IndexedDB Vektorspeicher gesichert.*`;

      let targetConv = activeConversation;
      if (!targetConv || !targetConv.title?.includes('ColBERT')) {
        targetConv = await conversationService.createGroup(
          `⚡ ColBERT: ${colbertFileName.substring(0, 20)}`,
          [],
          "ColBERT & File RAG"
        ).then(res => res.conversation).catch(() => activeConversation);
        if (targetConv) {
          await loadChatData();
          setActiveConversation(targetConv);
        }
      }

      if (targetConv) {
        await conversationService.sendMessage(targetConv.id, report, 'text');
        await loadMessages();
      }

      soundFx.playSubsystemStabilized();
      setShowColbertModal(false);
      setColbertFileName("");
      setColbertFileContent("");
    } catch (err) {
      console.error("ColBERT analysis error:", err);
      soundFx.playAlert();
    } finally {
      setIsAnalyzingColbert(false);
    }
  };
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [isChatListCollapsed, setIsChatListCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Voice dictation state
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState("");
  const [micVolume, setMicVolume] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition && !navigator.mediaDevices?.getUserMedia) {
      setSpeechSupported(false);
    }
  }, []);

  // Initialize data
  const loadChatData = async () => {
    const { user } = await identityService.initializeIdentity();
    setCurrentUserId(user.id);

    const rels = await relationshipRepository.getByState('accepted');
    setRelationships(rels);

    const cts = await contactRepository.getAll();
    setContacts(cts);

    let convs = await conversationService.getConversations();

    if (convs.length === 0 && rels.length > 0) {
      const firstPeer = rels[0].peerUserId;
      const initialConv = await conversationService.getOrCreateDirectConversation(firstPeer);
      convs = [initialConv];
    } else if (convs.length === 0) {
      const defaultConv = await conversationService.getOrCreateDirectConversation('peer_welcome_assistant');
      convs = [defaultConv];
    }

    setConversations(convs);

    if (!activeConversation && convs.length > 0) {
      setActiveConversation(convs[0]);
    }

    const syncStatus = await syncService.getStatus();
    setPendingQueueCount(syncStatus.pendingQueueCount);
  };

  useEffect(() => {
    loadChatData();

    const unsubMsg = eventBus.on(AppEvents.MESSAGE_QUEUED, () => loadMessages());
    const unsubSent = eventBus.on(AppEvents.MESSAGE_SENT, () => loadMessages());
    const unsubRcv = eventBus.on(AppEvents.MESSAGE_RECEIVED, () => loadMessages());
    const unsubStatus = eventBus.on(AppEvents.MESSAGE_STATUS_CHANGED, () => loadMessages());
    const unsubConv = eventBus.on(AppEvents.CONVERSATION_CREATED, () => loadChatData());

    return () => {
      unsubMsg();
      unsubSent();
      unsubRcv();
      unsubStatus();
      unsubConv();
    };
  }, []);

  const loadMessages = async () => {
    if (!activeConversation) return;
    const msgs = await conversationService.getMessages(activeConversation.id);
    setMessages(msgs);
    await conversationService.markConversationRead(activeConversation.id);

    const syncStatus = await syncService.getStatus();
    setPendingQueueCount(syncStatus.pendingQueueCount);
  };

  useEffect(() => {
    if (activeConversation) {
      loadMessages();
    }
  }, [activeConversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopVoiceDictation = () => {
    isListeningRef.current = false;
    soundFx.playMicStop();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setInterimSpeech("");
    setMicVolume(0);
  };

  const startVoiceDictation = async () => {
    setMicError(null);
    stopVoiceDictation();
    soundFx.playMicStart();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.5;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyserRef.current || !isListeningRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalized = Math.min(1, average / 128);
            setMicVolume(normalized);
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (audioErr) {
        console.warn("Audio analyser notice:", audioErr);
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || "en-US";

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalChunk = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptText = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += transcriptText;
            } else {
              currentInterim += transcriptText;
            }
          }

          if (finalChunk) {
            setInput((prev) => {
              const trimmed = prev.trim();
              const addition = finalChunk.trim();
              return trimmed ? `${trimmed} ${addition}` : addition;
            });
          }
          setInterimSpeech(currentInterim);
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e.error);
          if (e.error === 'not-allowed') {
            setMicError("Microphone permission denied.");
            stopVoiceDictation();
          } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
            setMicError(`Voice error: ${e.error}`);
          }
        };

        recognition.onend = () => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setMicError("Speech recognition API not supported in this browser.");
      }

      isListeningRef.current = true;
      setIsListening(true);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setMicError(err.name === "NotAllowedError" ? "Microphone permission denied." : "Microphone unavailable.");
      stopVoiceDictation();
    }
  };

  const toggleVoiceDictation = () => {
    if (isListening) {
      stopVoiceDictation();
    } else {
      startVoiceDictation();
    }
  };

  useEffect(() => {
    return () => {
      stopVoiceDictation();
    };
  }, []);

  const handleSendMessage = async () => {
    if (isListening) {
      stopVoiceDictation();
    }
    const messageToSend = input.trim();
    if (!messageToSend || !activeConversation || isSending) return;
    setIsSending(true);
    soundFx.playSend();

    try {
      setInput("");
      setInterimSpeech("");
      await conversationService.sendMessage(activeConversation.id, messageToSend, 'text');
      await loadMessages();
      soundFx.playConfirm();
    } catch (err) {
      console.error("Failed to send message:", err);
      soundFx.playAlert();
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeConversation) return;

    soundFx.playClick();
    try {
      let attachmentType: 'image' | 'audio' | 'video' | 'document' | 'file' = 'file';
      if (file.type.startsWith('image/')) attachmentType = 'image';
      else if (file.type.startsWith('audio/')) attachmentType = 'audio';
      else if (file.type.startsWith('video/')) attachmentType = 'video';
      else if (file.type.includes('pdf') || file.type.includes('text')) attachmentType = 'document';

      const attachment = await conversationService.saveAttachment(
        file.name,
        file.type,
        attachmentType,
        file
      );

      await conversationService.sendMessage(
        activeConversation.id,
        `Attachment: ${file.name}`,
        'attachment',
        attachment.id
      );

      await loadMessages();
      soundFx.playConfirm();
    } catch (err) {
      console.error("File upload error:", err);
      soundFx.playAlert();
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedGroupPeers.length === 0) return;
    soundFx.playConfirm();
    try {
      const { conversation } = await conversationService.createGroup(
        newGroupName.trim(),
        selectedGroupPeers,
        "Created via Chat Connect"
      );
      setShowNewGroupModal(false);
      setNewGroupName("");
      setSelectedGroupPeers([]);
      await loadChatData();
      setActiveConversation(conversation);
    } catch (err) {
      console.error("Failed to create group:", err);
      soundFx.playAlert();
    }
  };

  const getConversationTitle = (conv: ConversationEntity) => {
    if (conv.title) {
      return conv.title;
    }
    if (conv.type === 'group') {
      return conv.title || "Group Chat";
    }
    const otherParticipant = conv.participantIds.find((p) => p !== currentUserId);
    const contact = contacts.find((c) => c.id === otherParticipant);
    if (contact) return contact.displayName;
    if (otherParticipant === 'peer_welcome_assistant') return 'Local Welcome Note';
    if (otherParticipant) {
      return nicknameEngine.getNickname(otherParticipant);
    }
    return "Direct Conversation";
  };

  const filteredConversations = conversations.filter((conv) => {
    const title = getConversationTitle(conv);
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedFolder === 'research') {
      return title.includes('Research') || title.includes('Analyse') || title.includes('🌐');
    }
    if (selectedFolder === 'colbert') {
      return title.includes('ColBERT') || title.includes('RAG') || title.includes('⚡');
    }
    if (selectedFolder === 'audio') {
      return title.includes('Audio') || title.includes('Voice') || title.includes('🎙️');
    }
    if (selectedFolder === 'security') {
      return title.includes('Security') || title.includes('Gate') || conv.type === 'direct';
    }
    return true;
  });

  const handleSelectChoice = (choice: SmartChoice, autoSend = false) => {
    soundFx.playClick();
    if (choice.route && !autoSend) {
      navigate(choice.route);
      return;
    }
    setInput(choice.prompt);
    if (autoSend) {
      setTimeout(() => {
        handleSendMessageWithContent(choice.prompt);
      }, 50);
    }
  };

  const handleSendMessageWithContent = async (contentToSend: string) => {
    if (!contentToSend.trim() || !activeConversation || isSending) return;
    setIsSending(true);
    soundFx.playSend();

    try {
      await conversationService.sendMessage(activeConversation.id, contentToSend, 'text');
      setInput("");
      await loadMessages();
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setIsSending(false);
    }
  };

  const filteredSmartChoices = selectedCategory === 'all' 
    ? SMART_CHOICES 
    : SMART_CHOICES.filter(c => c.category === selectedCategory);

  return (
    <div className="flex h-full bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors overflow-hidden relative font-sans">
      {/* Conversations List Column (Resizable on Desktop, Full-width on Mobile) */}
      {!isChatListCollapsed && (
        <div 
          style={{ width: `${chatListWidth}px` }}
          className={`border-r border-[var(--border-color)] bg-[var(--bg-sidebar)]/70 backdrop-blur-md flex-col h-full shrink-0 select-none max-md:!w-full ${
            mobileView === 'list' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[var(--border-color)] space-y-2.5 bg-gradient-to-b from-[var(--bg-active)]/40 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs font-mono">
                <MessageSquare className="w-4 h-4 text-[var(--accent-neon)]" />
                <span className="text-[var(--text-primary)] tracking-tight uppercase">CONVERSATIONS</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/30 font-bold">
                  {conversations.length}
                </span>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowNewGroupModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--accent-neon)] hover:brightness-110 text-black transition shadow-[0_0_10px_var(--accent-glow)] font-mono"
                title="Create new group chat"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ GROUP</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-neon)] focus:ring-1 focus:ring-[var(--accent-neon)] transition font-mono"
              />
            </div>

            {/* Chat Folders Navigation */}
            <div className="pt-1 flex items-center gap-1 overflow-x-auto no-scrollbar font-mono text-[10px]">
              {CHAT_FOLDERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    soundFx.playBeep(900, 0.02);
                    setSelectedFolder(f.id);
                  }}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 shrink-0 transition ${
                    selectedFolder === f.id
                      ? "bg-[var(--accent-neon)] text-black font-bold shadow-sm"
                      : "bg-[var(--bg-main)]/60 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                  }`}
                >
                  <f.icon className="w-3 h-3" />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-tertiary)] space-y-1 font-mono">
                <p className="font-semibold text-[var(--text-secondary)]">NO CHATS LOCATED</p>
                <p className="text-[10px]">Initialize 1:1 encrypted link or group</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConversation?.id === conv.id;
                const title = getConversationTitle(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      soundFx.playClick();
                      setActiveConversation(conv);
                      setMobileView('chat');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition min-h-[50px] relative ${
                      isActive
                        ? "bg-[var(--accent-subtle)] border border-[var(--accent-neon)] shadow-[0_0_10px_var(--accent-glow)]"
                        : "hover:bg-[var(--bg-hover)] border border-transparent text-[var(--text-secondary)]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center shrink-0 text-xs font-bold text-[var(--accent-neon)]">
                      {conv.type === 'group' ? <Users className="w-4 h-4 text-indigo-400" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate text-[var(--text-primary)] font-mono">{title}</span>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[var(--accent-neon)] text-black">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5 font-mono">
                        {conv.type === 'group' ? 'GROUP // MULTI-PEER' : '1:1 // E2E P2P ECDSA'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Queue status footer */}
          {pendingQueueCount > 0 && (
            <div className="p-2.5 border-t border-[var(--border-color)] bg-amber-500/10 text-amber-500 text-xs flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingQueueCount} in offline outbox</span>
              </span>
              <button
                onClick={() => {
                  soundFx.playBeep(880, 0.05);
                  syncService.push();
                }}
                className="text-[10px] font-bold underline hover:text-amber-400 uppercase"
              >
                Flush
              </button>
            </div>
          )}
        </div>
      )}

      {/* Draggable Edge Resize Handle on Desktop */}
      {!isChatListCollapsed && (
        <div className="hidden md:block h-full shrink-0">
          <ResizeHandle
            orientation="vertical"
            onResize={(delta) => {
              setChatListWidth(chatListWidth + delta);
            }}
            id="chatlist-edge-resize"
          />
        </div>
      )}

      {/* Active Conversation Main Area */}
      <div 
        className={`flex-1 flex flex-col h-full min-w-0 bg-[var(--bg-main)] ${
          mobileView === 'chat' ? 'flex w-full' : 'hidden'
        } md:flex`}
      >
        {activeConversation ? (
          <>
            {/* Cyberpunk Akira HUD Header */}
            <header className="h-14 border-b border-[var(--border-color)] flex items-center justify-between px-3 sm:px-6 bg-[var(--bg-card)]/70 backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setMobileView('list');
                  }}
                  className="md:hidden p-2 -ml-1 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition shrink-0"
                  title="Back to conversation list"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Desktop Toggle Left List */}
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setIsChatListCollapsed(!isChatListCollapsed);
                  }}
                  className="hidden md:flex p-2 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-[var(--text-tertiary)] hover:text-[var(--accent-neon)] bg-[var(--bg-main)] transition"
                  title={isChatListCollapsed ? "Gesprächsliste einblenden" : "Gesprächsliste ausblenden (Reiner Chat-Fokus)"}
                >
                  {isChatListCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>

                <div className="w-8 h-8 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center font-bold text-xs shrink-0 text-[var(--accent-neon)] shadow-[0_0_8px_var(--accent-glow)]">
                  {activeConversation.type === 'group' ? <Users className="w-4 h-4 text-indigo-400" /> : <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] truncate font-mono flex items-center gap-1.5">
                    <span>{getConversationTitle(activeConversation)}</span>
                  </h2>
                  <p className="text-[9px] sm:text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 font-mono truncate">
                    <ShieldCheck className="w-3 h-3 text-[var(--accent-neon)] shrink-0" />
                    <span className="truncate">NEO-TOKYO // E2E P2P ENCRYPTION</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] px-2 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/40 uppercase font-mono font-bold">
                  {activeConversation.type === 'group' ? 'GROUP SEC' : 'P2P ECDSA'}
                </span>
              </div>
            </header>

            {/* Message Stream & Smart Choices Matrix */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="max-w-4xl mx-auto py-4 space-y-6">
                  {/* Hero Header */}
                  <div className="flex flex-col items-center justify-center text-center p-4 text-[var(--text-tertiary)] space-y-2 font-mono">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-neon)] shadow-[0_0_16px_var(--accent-glow)]">
                      <Flame className="w-6 h-6 fill-current animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">MUSCAL KOGNITIONS-OS // FOKUS-BEREICH</p>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md">
                      Wähle eine der vorkonfigurierten kognitiven Aktionen oder sende direkt einen Befehl.
                    </p>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center justify-center flex-wrap gap-1.5 font-mono text-xs">
                    {[
                      { id: 'all', label: 'Alle Optionen' },
                      { id: 'cognitive', label: '🧠 Kognitions-OS' },
                      { id: 'design', label: '🧬 Design Lab' },
                      { id: 'research', label: '🤖 Recherche' },
                      { id: 'mesh', label: '📁 P2P Mesh' },
                      { id: 'security', label: '🔐 Sicherheit' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedCategory(cat.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                          selectedCategory === cat.id
                            ? 'bg-[var(--accent-neon)] text-black border-[var(--accent-neon)] shadow-[0_0_10px_var(--accent-glow)]'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-neon)]/50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Smart Choice Matrix Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredSmartChoices.map((choice) => {
                      const Icon = choice.icon;
                      return (
                        <div
                          key={choice.id}
                          className="p-3.5 rounded-2xl bg-[var(--bg-card)]/90 border border-[var(--border-color)] hover:border-[var(--accent-neon)] transition-all flex flex-col justify-between group shadow-sm hover:shadow-[0_8px_24px_var(--accent-glow)] font-mono text-left"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-2 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/30 group-hover:scale-110 transition-transform">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-[9px] px-2 py-0.5 rounded-md bg-[var(--bg-main)] text-[var(--accent-neon)] border border-[var(--border-color)] font-bold">
                                {choice.badge}
                              </span>
                            </div>
                            <h3 className="text-xs font-extrabold text-[var(--text-primary)] mb-1">
                              {choice.title}
                            </h3>
                            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans line-clamp-2">
                              {choice.prompt}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleSelectChoice(choice, false)}
                              className="text-[10px] font-bold text-[var(--accent-neon)] hover:underline flex items-center gap-1"
                            >
                              <span>Übernehmen</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>

                            <button
                              onClick={() => handleSelectChoice(choice, true)}
                              className="px-2.5 py-1 rounded-lg bg-[var(--accent-neon)] text-black font-extrabold text-[10px] hover:brightness-110 transition shadow-sm"
                            >
                              Sofort Starten
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-2xl ${isMine ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-mono font-bold ${
                        isMine 
                          ? "bg-[var(--accent-neon)] text-black shadow-[0_0_8px_var(--accent-glow)]" 
                          : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]"
                      }`}>
                        {isMine ? "YOU" : "PEER"}
                      </div>

                      <div className={`space-y-1 flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                        <div
                          className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-md relative font-sans ${
                            isMine
                              ? "bg-[var(--accent-neon)] text-black font-medium shadow-[0_0_12px_var(--accent-glow)]"
                              : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-sm"
                          }`}
                        >
                          {/* Akira Corner Bracket Decoration */}
                          <div className={`absolute top-1 right-1.5 text-[8px] font-mono opacity-60 ${isMine ? "text-black" : "text-[var(--accent-neon)]"}`}>
                            {isMine ? "» TX" : "« RX"}
                          </div>

                          {msg.type === 'attachment' && (
                            <div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-black/10">
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="font-semibold truncate">{msg.content}</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>

                        {/* Lifecycle status indicator & Speech Synthesis button */}
                        <div className="flex items-center gap-2 text-[9px] text-[var(--text-tertiary)] px-1 font-mono">
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          
                          {/* Liquid Audio Speak Message Button */}
                          <button
                            onClick={() => handleToggleSpeakMessage(msg.id, msg.content)}
                            className={`p-1 rounded-md transition flex items-center gap-1 ${
                              speakingMessageId === msg.id
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                                : "hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                            }`}
                            title={speakingMessageId === msg.id ? "Sprachausgabe stoppen" : "Mit Liquid LFM-Audio vorlesen"}
                          >
                            {speakingMessageId === msg.id ? (
                              <>
                                <VolumeX className="w-3 h-3 text-rose-400" />
                                <span className="text-[8px] text-purple-400 font-bold">LFM AUDIO...</span>
                              </>
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>

                          {isMine && (
                            <span className="flex items-center gap-0.5">
                              {msg.status === 'queued' && (
                                <Clock className="w-3 h-3 text-amber-400" title="Queued (Offline)" />
                              )}
                              {msg.status === 'sent' && (
                                <Check className="w-3 h-3 text-[var(--text-tertiary)]" title="Sent over mesh" />
                              )}
                              {msg.status === 'delivered' && (
                                <CheckCheck className="w-3 h-3 text-emerald-400" title="Delivered to peer" />
                              )}
                              {msg.status === 'read' && (
                                <CheckCheck className="w-3 h-3 text-[var(--accent-neon)]" title="Read by peer" />
                              )}
                              {msg.status === 'failed' && (
                                <AlertCircle className="w-3 h-3 text-red-500" title="Failed to deliver" />
                              )}
                              <span className="capitalize">{msg.status}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Quick Choice Action Chips docked directly above input */}
            <div className="px-3.5 pt-2 pb-0 flex items-center gap-2 overflow-x-auto no-scrollbar font-mono text-xs bg-[var(--bg-sidebar)]/30 border-t border-[var(--border-color)]/50">
              <span className="text-[10px] text-[var(--text-tertiary)] font-bold shrink-0 uppercase">
                Liquid KI Tools:
              </span>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setIsVoiceStreamDocked(!isVoiceStreamDocked);
                }}
                className={`px-2.5 py-1 rounded-lg border transition shrink-0 flex items-center gap-1.5 text-[11px] font-bold ${
                  isVoiceStreamDocked
                    ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                    : "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:text-cyan-300"
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isVoiceStreamDocked ? "animate-pulse" : ""}`} />
                <span>Voice Stream Controller {isVoiceStreamDocked ? "(Aktiv)" : ""}</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowWebResearchModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition shrink-0 flex items-center gap-1.5 text-[11px] font-bold"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web Research Tool</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowColbertModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:text-purple-300 transition shrink-0 flex items-center gap-1.5 text-[11px] font-bold"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ColBERT File RAG</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowVoiceStreamController(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition shrink-0 flex items-center gap-1.5 text-[11px] font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>LFM-Audio Console HUD</span>
              </button>
              <button
                onClick={() => navigate("/cognitive-os")}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--accent-subtle)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-[var(--text-secondary)] hover:text-[var(--accent-neon)] transition shrink-0 flex items-center gap-1.5 text-[11px] font-bold"
              >
                <Brain className="w-3 h-3 text-[var(--accent-neon)]" />
                <span>Kognitionsraum</span>
              </button>
              <button
                onClick={() => navigate("/design-lab")}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--accent-subtle)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-[var(--text-secondary)] hover:text-[var(--accent-neon)] transition shrink-0 flex items-center gap-1.5 text-[11px] font-bold"
              >
                <Dna className="w-3 h-3 text-purple-400" />
                <span>Design-Lab</span>
              </button>
              <button
                onClick={() => navigate("/files")}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--accent-subtle)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-[var(--text-secondary)] hover:text-[var(--accent-neon)] transition shrink-0 flex items-center gap-1.5 text-[11px] font-bold"
              >
                <FolderSync className="w-3 h-3 text-blue-400" />
                <span>P2P Sync</span>
              </button>
            </div>

            {/* Docked VoiceStreamController */}
            <AnimatePresence>
              {isVoiceStreamDocked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3.5 pt-3 overflow-hidden"
                >
                  <VoiceStreamController
                    onClose={() => setIsVoiceStreamDocked(false)}
                    onTranscriptCaptured={(text) => {
                      setInput((prev) => (prev ? `${prev} ${text}` : text));
                    }}
                    onDirectSend={(text) => handleVoiceStreamDirectSend(text)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Composer */}
            <div className="p-3.5 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)]/60 backdrop-blur-md space-y-2">
              {/* Voice Error Notification */}
              {micError && (
                <div className="max-w-4xl mx-auto flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{micError}</span>
                  </div>
                  <button
                    onClick={() => setMicError(null)}
                    className="text-[10px] font-bold hover:underline ml-2"
                  >
                    DISMISS
                  </button>
                </div>
              )}

              {/* Active Voice Dictation Banner */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="max-w-4xl mx-auto p-3 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-neon)]/50 flex items-center justify-between gap-3 text-xs shadow-[0_0_16px_var(--accent-glow)] font-mono"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Animated sound wave bars */}
                      <div className="flex items-center gap-0.5 h-5 px-1 bg-[var(--accent-neon)]/20 rounded-md shrink-0">
                        <span
                          className="w-1 bg-[var(--accent-neon)] rounded-full transition-all duration-75"
                          style={{ height: `${Math.max(4, micVolume * 20)}px` }}
                        />
                        <span
                          className="w-1 bg-[var(--accent-neon)] rounded-full transition-all duration-75"
                          style={{ height: `${Math.max(4, (micVolume * 28) + 2)}px` }}
                        />
                        <span
                          className="w-1 bg-[var(--accent-neon)] rounded-full transition-all duration-75"
                          style={{ height: `${Math.max(4, micVolume * 16)}px` }}
                        />
                        <span
                          className="w-1 bg-[var(--accent-neon)] rounded-full transition-all duration-75"
                          style={{ height: `${Math.max(4, (micVolume * 24) + 1)}px` }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[var(--accent-neon)] mr-2">
                          REC // LISTENING...
                        </span>
                        {interimSpeech ? (
                          <span className="text-[var(--text-primary)] italic truncate">
                            "{interimSpeech}"
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)] text-[10px]">
                            Awaiting vocal input telemetry...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={stopVoiceDictation}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[var(--accent-neon)] text-black transition shadow font-mono"
                      >
                        DONE
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="max-w-4xl mx-auto flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-neon)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition shrink-0"
                  title="Upload attachment"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Voice Dictation Button */}
                <button
                  onClick={toggleVoiceDictation}
                  className={`p-2.5 rounded-xl border transition shrink-0 relative ${
                    isListening
                      ? "bg-[var(--accent-neon)] text-black border-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-glow)] animate-pulse"
                      : "border-[var(--border-color)] hover:border-[var(--accent-neon)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--accent-neon)]"
                  }`}
                  title={isListening ? "Stop voice dictation" : "Dictate message with microphone"}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-black" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isListening ? "Dictating..." : "Transmit message to peer..."}
                  className={`flex-1 px-4 py-2.5 text-xs rounded-xl border bg-[var(--bg-card)] focus:outline-none focus:border-[var(--accent-neon)] focus:ring-1 focus:ring-[var(--accent-neon)] text-[var(--text-primary)] transition font-mono ${
                    isListening ? "border-[var(--accent-neon)] ring-1 ring-[var(--accent-neon)]/30" : "border-[var(--border-color)]"
                  }`}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isSending}
                  className="px-4 py-2.5 bg-[var(--accent-neon)] hover:brightness-110 disabled:opacity-40 text-black text-xs font-bold rounded-xl shadow-[0_0_12px_var(--accent-glow)] transition flex items-center gap-1.5 shrink-0 font-mono"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>TRANSMIT</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)] font-mono">
            SELECT CHANNEL TO INITIALIZE TERMINAL STREAM
          </div>
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[var(--border-color)] space-y-4 font-mono">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent-neon)]" />
              <span>CREATE GROUP CONVERSATION</span>
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)]">GROUP DESIGNATOR</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. SQUAD ALPHA // 2088"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-neon)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)]">SELECT PEER MEMBERS</label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/60">
                {relationships.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)] text-center py-2">No connected peers yet. Pair via QR in Devices tab first.</p>
                ) : (
                  relationships.map((rel) => {
                    const contact = contacts.find((c) => c.id === rel.peerUserId);
                    const isSelected = selectedGroupPeers.includes(rel.peerUserId);
                    return (
                      <label
                        key={rel.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            soundFx.playClick();
                            if (e.target.checked) {
                              setSelectedGroupPeers([...selectedGroupPeers, rel.peerUserId]);
                            } else {
                              setSelectedGroupPeers(selectedGroupPeers.filter((id) => id !== rel.peerUserId));
                            }
                          }}
                          className="rounded text-[var(--accent-neon)] focus:ring-[var(--accent-neon)]"
                        />
                        <span className="font-bold text-[var(--text-primary)]">
                          {contact?.displayName || rel.peerUserId.substring(0, 10)}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg transition"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedGroupPeers.length === 0}
                className="px-4 py-2 text-xs font-bold bg-[var(--accent-neon)] hover:brightness-110 disabled:opacity-50 text-black rounded-lg transition shadow-[0_0_10px_var(--accent-glow)]"
              >
                CREATE GROUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web Research Tool Modal */}
      {showWebResearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border-color)] space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Globe className="w-5 h-5" />
                <span>LIQUID LFM-TOOL // WEB RESEARCH AGENT</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                EPISTEMIC SEARCH
              </span>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed font-sans">
              Führt autonome Multi-Hop Web-Recherchen mit epistemic Confidence-Scoring durch und legt die Zusammenfassung direkt im dedizierten Chat-Ordner "Web Research & KI Analysen" ab.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)]">RECHERCHE-FRAGESTELLUNG / SUCHBEGRIFF</label>
              <textarea
                value={webResearchQuery}
                onChange={(e) => setWebResearchQuery(e.target.value)}
                placeholder="z.B.: Neueste Entwicklungen bei Liquid State-Space Models vs Transformers 2026..."
                rows={3}
                className="w-full p-3 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => setShowWebResearchModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-xl transition"
              >
                ABBRECHEN
              </button>
              <button
                onClick={handleRunWebResearch}
                disabled={!webResearchQuery.trim() || isResearching}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2"
              >
                {isResearching ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    <span>RECHERCHIERE...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>RECHERCHE STARTEN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ColBERT File RAG Modal */}
      {showColbertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border-color)] space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Layers className="w-5 h-5" />
                <span>LIQUID COLBERT // MULTI-VECTOR FILE RAG</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
                LATE INTERACTION
              </span>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed font-sans">
              Analysiert Dokumente und Code-Dateien mit Liquid ColBERT Late-Interaction Vektoren und generiert einen Kausalgraphen mit Token-Embeddings.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)]">DATEINAME / DOKUMENT-TITEL</label>
                <input
                  type="text"
                  value={colbertFileName}
                  onChange={(e) => setColbertFileName(e.target.value)}
                  placeholder="z.B.: Whitepaper_Liquid_AI_2026.pdf"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)]">INHALT / TEXTAUSZUG</label>
                <textarea
                  value={colbertFileContent}
                  onChange={(e) => setColbertFileContent(e.target.value)}
                  placeholder="Fügen Sie Text oder Code ein oder lassen Sie das Feld leer für automatische Indizierung..."
                  rows={4}
                  className="w-full mt-1 p-3 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => setShowColbertModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-xl transition"
              >
                ABBRECHEN
              </button>
              <button
                onClick={handleRunColBERTAnalysis}
                disabled={!colbertFileName.trim() || isAnalyzingColbert}
                className="px-5 py-2.5 text-xs font-bold bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white rounded-xl transition shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2"
              >
                {isAnalyzingColbert ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    <span>INDIZIERE...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>COLBERT ANALYSE STARTEN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liquid LFM-Audio Vocal Processor HUD Modal */}
      {showLiquidAudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-2xl">
            <LiquidVoiceVocalProcessor
              onClose={() => setShowLiquidAudioModal(false)}
              onTranscriptCaptured={(text) => {
                setInput((prev) => (prev ? `${prev} ${text}` : text));
              }}
            />
          </div>
        </div>
      )}

      {/* Liquid LFM-Audio VoiceStreamController Modal */}
      {showVoiceStreamController && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-3xl">
            <VoiceStreamController
              isExpandedDefault={true}
              onClose={() => setShowVoiceStreamController(false)}
              onTranscriptCaptured={(text) => {
                setInput((prev) => (prev ? `${prev} ${text}` : text));
              }}
              onDirectSend={(text) => {
                handleVoiceStreamDirectSend(text);
                setShowVoiceStreamController(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
