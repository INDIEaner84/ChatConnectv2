import { create } from 'zustand';
import { Message, ExecutionTraceEntry, WebRTCDevice } from '../lib/interfaces';
import { agentRouter } from '../lib/AgentRouter';
import { webrtcConnectionManager } from '../lib/WebRTCConnectionManager';
import { auditLogger } from '../lib/AuditLogger';
import { AkiraThemeId, applyThemeToDOM } from '../lib/themeEngine';
import { soundFx } from '../lib/soundFx';
import {
  ExplorerTemplateId,
  TemplateDesignDNA,
  TemplateUsageMetrics,
  TemplatePreferenceProfile
} from '../types/designEvolution';
import {
  DEFAULT_TEMPLATE_DNA,
  DEFAULT_TEMPLATE_USAGE,
  DEFAULT_PREFERENCE_PROFILE,
  recomputePreferenceProfile,
  evolveTemplateDNATowardsPreferences
} from '../lib/designEvolutionEngine';

export type SystemSessionMode = 'boot' | 'operational' | 'Boot' | 'Operational';

export interface SessionStateSlice {
  mode: SystemSessionMode;
  status: SystemSessionMode;
  operational: boolean;
  lastInitializedAt?: string;
  bootCount?: number;
  initializationDurationMs?: number;
}

export type { ExplorerTemplateId };

interface MuscalState {
  theme: 'light' | 'dark';
  akiraTheme: AkiraThemeId;
  setAkiraTheme: (themeId: AkiraThemeId) => void;
  toggleTheme: () => void;
  
  scanlines: boolean;
  toggleScanlines: () => void;

  sfxEnabled: boolean;
  toggleSfx: () => void;

  explorerTemplate: ExplorerTemplateId;
  setExplorerTemplate: (template: ExplorerTemplateId) => void;

  // DesignEvolutionEngine Slice: Template Design DNA & Preference Learning
  templateDNA: Record<ExplorerTemplateId, TemplateDesignDNA>;
  templateUsage: Record<ExplorerTemplateId, TemplateUsageMetrics>;
  templatePreferences: TemplatePreferenceProfile;
  updateTemplateDNA: (templateId: ExplorerTemplateId, partialDNA: Partial<TemplateDesignDNA>) => void;
  recordTemplateInteraction: (templateId: ExplorerTemplateId, action: 'select' | 'dwell' | 'preview' | 'filter' | 'rag_transfer') => void;
  evolveTemplateDNA: (templateId: ExplorerTemplateId) => TemplateDesignDNA;
  evolveAllTemplates: () => void;
  resetTemplateDNA: (templateId?: ExplorerTemplateId) => void;
  rateTemplate: (templateId: ExplorerTemplateId, rating: number) => void;
  getRecommendedTemplate: () => ExplorerTemplateId;

  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  chatListWidth: number;
  setChatListWidth: (width: number) => void;

  focusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
  toggleFocusMode: () => void;

  // Persistent Session State Slice ('boot' vs 'operational')
  sessionState: SessionStateSlice;
  setSessionState: (state: Partial<SessionStateSlice> | SystemSessionMode) => void;
  setOperational: (operational: boolean) => void;
  isBooting: boolean;
  triggerSystemBoot: () => void;
  completeSystemBoot: (durationMs?: number) => void;

  messages: Message[];
  addMessage: (msg: Message) => void;
  
  trace: ExecutionTraceEntry[];
  addTraceEntry: (entry: ExecutionTraceEntry) => void;
  
  devices: WebRTCDevice[];
  addDevice: (device: WebRTCDevice) => void;
  updateDeviceState: (id: string, state: WebRTCDevice['connectionState']) => void;

  sendMessage: (content: string) => Promise<void>;
  
  isProcessing: boolean;
}

// Initial theme & layout settings recovery from localStorage
const initialAkiraTheme: AkiraThemeId = (localStorage.getItem('muscal_akira_theme') as AkiraThemeId) || 'akira-red';
const initialScanlines: boolean = localStorage.getItem('muscal_scanlines') === 'true';
const initialSidebarWidth: number = parseInt(localStorage.getItem('muscal_sidebar_width') || '260', 10);
const initialChatListWidth: number = parseInt(localStorage.getItem('muscal_chatlist_width') || '320', 10);
const initialFocusMode: boolean = localStorage.getItem('muscal_focus_mode') === 'true';
const initialExplorerTemplate: ExplorerTemplateId = (localStorage.getItem('muscal_explorer_template') as ExplorerTemplateId) || 'grid';

// Helpers to recover and persist Design Evolution Engine data
const getInitialTemplateDNA = (): Record<ExplorerTemplateId, TemplateDesignDNA> => {
  try {
    const raw = localStorage.getItem('muscal_template_dna');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.grid && parsed.list && parsed.spatial && parsed.tree) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to recover muscal_template_dna from localStorage', e);
  }
  return DEFAULT_TEMPLATE_DNA;
};

const getInitialTemplateUsage = (): Record<ExplorerTemplateId, TemplateUsageMetrics> => {
  try {
    const raw = localStorage.getItem('muscal_template_usage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.grid) return parsed;
    }
  } catch (e) {
    console.warn('Failed to recover muscal_template_usage from localStorage', e);
  }
  return DEFAULT_TEMPLATE_USAGE;
};

const getInitialTemplatePreferences = (): TemplatePreferenceProfile => {
  try {
    const raw = localStorage.getItem('muscal_template_preferences');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.recommendedTemplate) return parsed;
    }
  } catch (e) {
    console.warn('Failed to recover muscal_template_preferences from localStorage', e);
  }
  return DEFAULT_PREFERENCE_PROFILE;
};

const initialTemplateDNA = getInitialTemplateDNA();
const initialTemplateUsage = getInitialTemplateUsage();
const initialTemplatePreferences = getInitialTemplatePreferences();

const persistDesignEvolutionData = (
  dna: Record<ExplorerTemplateId, TemplateDesignDNA>,
  usage: Record<ExplorerTemplateId, TemplateUsageMetrics>,
  prefs: TemplatePreferenceProfile
) => {
  try {
    localStorage.setItem('muscal_template_dna', JSON.stringify(dna));
    localStorage.setItem('muscal_template_usage', JSON.stringify(usage));
    localStorage.setItem('muscal_template_preferences', JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to persist design evolution data', e);
  }
};

// Helper to reliably recover persistent session state slice across page reloads
const getInitialSessionState = (): SessionStateSlice => {
  try {
    const rawSlice = localStorage.getItem('muscal_session_slice');
    if (rawSlice) {
      const parsed = JSON.parse(rawSlice);
      if (parsed && (parsed.mode || parsed.operational !== undefined)) {
        const isOp = parsed.operational === true || parsed.mode?.toLowerCase() === 'operational';
        return {
          mode: isOp ? 'operational' : 'boot',
          status: isOp ? 'operational' : 'boot',
          operational: isOp,
          lastInitializedAt: parsed.lastInitializedAt || localStorage.getItem('muscal_last_initialized') || undefined,
          bootCount: parsed.bootCount || parseInt(localStorage.getItem('muscal_boot_count') || '1', 10),
          initializationDurationMs: parsed.initializationDurationMs || 0
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse muscal_session_slice from localStorage', e);
  }

  const savedSessionMode = localStorage.getItem('muscal_session_state');
  const savedOperational = localStorage.getItem('muscal_operational') === 'true' || savedSessionMode?.toLowerCase() === 'operational';
  
  return {
    mode: savedOperational ? 'operational' : 'boot',
    status: savedOperational ? 'operational' : 'boot',
    operational: savedOperational,
    lastInitializedAt: localStorage.getItem('muscal_last_initialized') || undefined,
    bootCount: parseInt(localStorage.getItem('muscal_boot_count') || '1', 10),
    initializationDurationMs: 0
  };
};

const initialSessionState = getInitialSessionState();

// Helper to save session state slice to localStorage
const persistSessionStateSlice = (slice: SessionStateSlice) => {
  try {
    localStorage.setItem('muscal_session_slice', JSON.stringify(slice));
    localStorage.setItem('muscal_session_state', slice.mode);
    localStorage.setItem('muscal_operational', String(slice.operational));
    if (slice.lastInitializedAt) {
      localStorage.setItem('muscal_last_initialized', slice.lastInitializedAt);
    }
    if (slice.bootCount) {
      localStorage.setItem('muscal_boot_count', String(slice.bootCount));
    }
  } catch (e) {
    console.warn('Failed to persist muscal_session_slice to localStorage', e);
  }
};

// Apply on initial script load
if (typeof document !== 'undefined') {
  applyThemeToDOM(initialAkiraTheme);
}

export const useMuscalStore = create<MuscalState>((set, get) => ({
  theme: initialAkiraTheme === 'solar-light' ? 'light' : 'dark',
  akiraTheme: initialAkiraTheme,
  
  sessionState: initialSessionState,
  isBooting: !initialSessionState.operational,
  
  setOperational: (operational: boolean) => {
    const mode: SystemSessionMode = operational ? 'operational' : 'boot';
    const current = get().sessionState;
    const nextState: SessionStateSlice = {
      ...current,
      operational,
      mode,
      status: mode,
      lastInitializedAt: operational ? (current.lastInitializedAt || new Date().toISOString()) : current.lastInitializedAt
    };
    persistSessionStateSlice(nextState);
    set({
      sessionState: nextState,
      isBooting: !operational,
    });
  },

  setSessionState: (update) => {
    const current = get().sessionState;
    let nextState: SessionStateSlice;

    if (typeof update === 'string') {
      const isOp = update.toLowerCase() === 'operational';
      nextState = {
        ...current,
        mode: update,
        status: update,
        operational: isOp,
        lastInitializedAt: isOp ? (current.lastInitializedAt || new Date().toISOString()) : current.lastInitializedAt
      };
    } else {
      const isModeOperational = update.mode ? update.mode.toLowerCase() === 'operational' : (update.status ? update.status.toLowerCase() === 'operational' : current.operational);
      const operational = update.operational !== undefined ? update.operational : isModeOperational;
      const mode = update.mode || update.status || (operational ? 'operational' : 'boot');
      nextState = {
        ...current,
        ...update,
        mode,
        status: mode,
        operational,
        lastInitializedAt: operational ? (update.lastInitializedAt || current.lastInitializedAt || new Date().toISOString()) : current.lastInitializedAt
      };
    }

    persistSessionStateSlice(nextState);
    set({
      sessionState: nextState,
      isBooting: !nextState.operational,
    });
  },

  triggerSystemBoot: () => {
    const current = get().sessionState;
    const nextState: SessionStateSlice = {
      ...current,
      mode: 'boot',
      status: 'boot',
      operational: false,
      bootCount: (current.bootCount || 1) + 1
    };
    persistSessionStateSlice(nextState);
    soundFx.playBeep(440, 0.1);
    set({
      sessionState: nextState,
      isBooting: true,
    });
  },

  completeSystemBoot: (durationMs?: number) => {
    const now = new Date().toISOString();
    const current = get().sessionState;
    const nextState: SessionStateSlice = {
      ...current,
      mode: 'operational',
      status: 'operational',
      operational: true,
      lastInitializedAt: now,
      initializationDurationMs: durationMs || current.initializationDurationMs || 0
    };
    persistSessionStateSlice(nextState);
    set({
      sessionState: nextState,
      isBooting: false,
    });
  },

  focusMode: initialFocusMode,
  setFocusMode: (enabled: boolean) => {
    localStorage.setItem('muscal_focus_mode', String(enabled));
    soundFx.playClick();
    set({ focusMode: enabled });
  },
  toggleFocusMode: () => set((state) => {
    const next = !state.focusMode;
    localStorage.setItem('muscal_focus_mode', String(next));
    return { focusMode: next };
  }),
  
  setAkiraTheme: (themeId: AkiraThemeId) => {
    localStorage.setItem('muscal_akira_theme', themeId);
    applyThemeToDOM(themeId);
    soundFx.playThemeSwitch();
    
    auditLogger.log({
      category: "SYSTEM",
      severity: "INFO",
      action: "THEME_CHANGED",
      description: `Activated Akira neon theme: ${themeId.toUpperCase()}`,
      actor: "USER",
      metadata: { themeId }
    });

    set({ 
      akiraTheme: themeId,
      theme: themeId === 'solar-light' ? 'light' : 'dark'
    });
  },

  toggleTheme: () => {
    const current = get().akiraTheme;
    const next: AkiraThemeId = current === 'solar-light' ? 'akira-red' : 'solar-light';
    get().setAkiraTheme(next);
  },

  scanlines: initialScanlines,
  toggleScanlines: () => set((state) => {
    const next = !state.scanlines;
    localStorage.setItem('muscal_scanlines', String(next));
    soundFx.playClick();
    return { scanlines: next };
  }),

  sfxEnabled: soundFx.isEnabled(),
  toggleSfx: () => {
    const current = soundFx.isEnabled();
    soundFx.setEnabled(!current);
    set({ sfxEnabled: !current });
  },

  explorerTemplate: initialExplorerTemplate,
  setExplorerTemplate: (template: ExplorerTemplateId) => {
    localStorage.setItem('muscal_explorer_template', template);
    soundFx.playClick();
    get().recordTemplateInteraction(template, 'select');
    set({ explorerTemplate: template });
  },

  // DesignEvolutionEngine Slice Implementation
  templateDNA: initialTemplateDNA,
  templateUsage: initialTemplateUsage,
  templatePreferences: initialTemplatePreferences,

  updateTemplateDNA: (templateId: ExplorerTemplateId, partialDNA: Partial<TemplateDesignDNA>) => {
    soundFx.playClick();
    const state = get();
    const currentDNA = state.templateDNA[templateId] || DEFAULT_TEMPLATE_DNA[templateId];
    const updatedDNA: TemplateDesignDNA = {
      ...currentDNA,
      ...partialDNA,
      lastMutatedAt: new Date().toISOString()
    };

    const nextDNA = {
      ...state.templateDNA,
      [templateId]: updatedDNA
    };

    const currentUsage = state.templateUsage[templateId] || DEFAULT_TEMPLATE_USAGE[templateId];
    const nextUsage = {
      ...state.templateUsage,
      [templateId]: {
        ...currentUsage,
        directModificationsCount: currentUsage.directModificationsCount + 1
      }
    };

    const nextPrefs = recomputePreferenceProfile(nextUsage, nextDNA);
    persistDesignEvolutionData(nextDNA, nextUsage, nextPrefs);

    set({
      templateDNA: nextDNA,
      templateUsage: nextUsage,
      templatePreferences: nextPrefs
    });
  },

  recordTemplateInteraction: (templateId: ExplorerTemplateId, action: 'select' | 'dwell' | 'preview' | 'filter' | 'rag_transfer') => {
    const state = get();
    const currentUsage = state.templateUsage[templateId] || DEFAULT_TEMPLATE_USAGE[templateId];
    
    let nextUsageItem = { ...currentUsage };
    if (action === 'select') {
      nextUsageItem.selectionCount += 1;
      nextUsageItem.lastSelectedAt = new Date().toISOString();
    } else if (action === 'dwell') {
      nextUsageItem.totalDwellTimeMs += 5000;
    } else {
      nextUsageItem.interactionCount += 1;
    }

    const nextUsage = {
      ...state.templateUsage,
      [templateId]: nextUsageItem
    };

    const nextPrefs = recomputePreferenceProfile(nextUsage, state.templateDNA);
    persistDesignEvolutionData(state.templateDNA, nextUsage, nextPrefs);

    set({
      templateUsage: nextUsage,
      templatePreferences: nextPrefs
    });
  },

  evolveTemplateDNA: (templateId: ExplorerTemplateId) => {
    soundFx.playSystemBootBeep();
    const state = get();
    const currentDNA = state.templateDNA[templateId] || DEFAULT_TEMPLATE_DNA[templateId];
    const evolvedDNA = evolveTemplateDNATowardsPreferences(currentDNA, state.templatePreferences);

    const nextDNA = {
      ...state.templateDNA,
      [templateId]: evolvedDNA
    };

    const nextPrefs = recomputePreferenceProfile(state.templateUsage, nextDNA);
    persistDesignEvolutionData(nextDNA, state.templateUsage, nextPrefs);

    set({
      templateDNA: nextDNA,
      templatePreferences: nextPrefs
    });

    return evolvedDNA;
  },

  evolveAllTemplates: () => {
    soundFx.playThemeSwitch();
    const state = get();
    const templates: ExplorerTemplateId[] = ['grid', 'list', 'spatial', 'tree'];
    const nextDNA: Record<ExplorerTemplateId, TemplateDesignDNA> = { ...state.templateDNA };

    templates.forEach((t) => {
      nextDNA[t] = evolveTemplateDNATowardsPreferences(nextDNA[t] || DEFAULT_TEMPLATE_DNA[t], state.templatePreferences);
    });

    const nextPrefs = recomputePreferenceProfile(state.templateUsage, nextDNA);
    persistDesignEvolutionData(nextDNA, state.templateUsage, nextPrefs);

    set({
      templateDNA: nextDNA,
      templatePreferences: nextPrefs
    });
  },

  resetTemplateDNA: (templateId?: ExplorerTemplateId) => {
    soundFx.playClick();
    const state = get();
    let nextDNA: Record<ExplorerTemplateId, TemplateDesignDNA>;
    if (templateId) {
      nextDNA = {
        ...state.templateDNA,
        [templateId]: { ...DEFAULT_TEMPLATE_DNA[templateId] }
      };
    } else {
      nextDNA = { ...DEFAULT_TEMPLATE_DNA };
    }

    const nextPrefs = recomputePreferenceProfile(state.templateUsage, nextDNA);
    persistDesignEvolutionData(nextDNA, state.templateUsage, nextPrefs);

    set({
      templateDNA: nextDNA,
      templatePreferences: nextPrefs
    });
  },

  rateTemplate: (templateId: ExplorerTemplateId, rating: number) => {
    soundFx.playClick();
    const state = get();
    const currentUsage = state.templateUsage[templateId] || DEFAULT_TEMPLATE_USAGE[templateId];
    const nextUsage = {
      ...state.templateUsage,
      [templateId]: {
        ...currentUsage,
        explicitRating: Math.max(1, Math.min(5, rating))
      }
    };

    const nextPrefs = recomputePreferenceProfile(nextUsage, state.templateDNA);
    persistDesignEvolutionData(state.templateDNA, nextUsage, nextPrefs);

    set({
      templateUsage: nextUsage,
      templatePreferences: nextPrefs
    });
  },

  getRecommendedTemplate: () => {
    return get().templatePreferences.recommendedTemplate || 'grid';
  },

  sidebarWidth: Math.max(180, Math.min(500, initialSidebarWidth)),
  setSidebarWidth: (width: number) => {
    const clamped = Math.max(180, Math.min(500, width));
    localStorage.setItem('muscal_sidebar_width', String(clamped));
    set({ sidebarWidth: clamped });
  },

  chatListWidth: Math.max(200, Math.min(550, initialChatListWidth)),
  setChatListWidth: (width: number) => {
    const clamped = Math.max(200, Math.min(550, width));
    localStorage.setItem('muscal_chatlist_width', String(clamped));
    set({ chatListWidth: clamped });
  },

  messages: [
    {
      id: 'system-init',
      role: 'assistant',
      content: 'MUSCAL System Initialized. Awaiting input.',
      timestamp: Date.now()
    }
  ],
  trace: [],
  devices: [],
  isProcessing: false,

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  addTraceEntry: (entry) => set((state) => ({ trace: [...state.trace, entry] })),
  addDevice: (device) => set((state) => ({ devices: [...state.devices, device] })),
  updateDeviceState: (id, connectionState) => set((state) => ({
    devices: state.devices.map(d => d.id === id ? { ...d, connectionState } : d)
  })),

  sendMessage: async (content: string) => {
    soundFx.playSend();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    set((state) => ({ 
      messages: [...state.messages, userMsg],
      isProcessing: true
    }));

    const startTime = Date.now();
    const activeDevice = get().devices.find(d => d.connectionState === 'connected');
    const targetDeviceId = activeDevice ? activeDevice.id : 'local-peer';

    try {
      // 1. Broadcast over WebRTC DataChannel if peer connection exists
      webrtcConnectionManager.sendData({
        type: "CHAT",
        payload: { content, role: "user" }
      });

      // 2. Intercept and dynamically route via AgentRouter
      const { response, decision, latencyMs } = await agentRouter.executeQuery(
        content,
        get().messages
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now()
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isProcessing: false
      }));

      soundFx.playConfirm();

      // 3. Record full telemetry trace in execution history
      get().addTraceEntry({
        id: Date.now().toString(),
        timestamp: Date.now(),
        intent: `query_routing (${decision.strategyUsed})`,
        model: decision.selectedModel,
        plan: decision.reason,
        tool: decision.selectedLayer === "LOCAL" ? "edge_tensor" : decision.selectedLayer === "SERVER" ? "muscal_orchestrator" : "gemini_cloud",
        arguments: { query: content, strategy: decision.strategyUsed, targetDeviceId },
        action: `routeTo_${decision.selectedLayer}`,
        observation: `Execution completed successfully on ${decision.selectedModel}`,
        verification: `Layer response verified (${latencyMs}ms)`,
        result: "Success",
        latency: latencyMs,
        layer: decision.selectedLayer
      });

    } catch (error: any) {
      set({ isProcessing: false });
      soundFx.playAlert();
      
      get().addTraceEntry({
        id: Date.now().toString(),
        timestamp: Date.now(),
        intent: "query_routing_error",
        model: "agent-router",
        plan: "Dynamic dispatch failed",
        tool: "router",
        arguments: { content },
        action: "interceptAndRoute",
        observation: "Routing execution threw error",
        verification: "Fallback inspected",
        result: "Error",
        latency: Date.now() - startTime,
        layer: "LOCAL",
        error: error.message || String(error)
      });
    }
  }
}));
