/**
 * AgentRouter Service
 * Intercepts user queries and dynamically routes them to local, server, or cloud-based
 * AI models based on the model registry, intent analysis, and system availability.
 */

import { ExecutionLayer, Message, ModelProvider, ModelResponse } from "./interfaces";
import { LocalModelProvider } from "./providers/LocalModelProvider";
import { ServerModelProvider } from "./providers/ServerModelProvider";
import { CloudModelProvider } from "./providers/CloudModelProvider";
import { auditLogger } from "./AuditLogger";

export interface ModelRegistryEntry {
  id: string;
  name: string;
  layer: ExecutionLayer;
  contextWindow: number;
  latencyTier: "ULTRA_LOW" | "BALANCED" | "HIGH_CAPACITY";
  capabilities: string[];
  enabled: boolean;
  providerInstance: ModelProvider;
}

export type RoutingStrategy = "AUTO" | "FORCE_LOCAL" | "FORCE_SERVER" | "FORCE_CLOUD";

export interface RoutingDecision {
  selectedLayer: ExecutionLayer;
  selectedModel: string;
  provider: ModelProvider;
  strategyUsed: RoutingStrategy;
  confidence: number;
  reason: string;
  estimatedLatencyMs: number;
}

export class AgentRouter {
  private static instance: AgentRouter;
  private registry: Map<string, ModelRegistryEntry> = new Map();
  private currentStrategy: RoutingStrategy = "AUTO";

  private constructor() {
    this.initializeRegistry();
  }

  public static getInstance(): AgentRouter {
    if (!AgentRouter.instance) {
      AgentRouter.instance = new AgentRouter();
    }
    return AgentRouter.instance;
  }

  private initializeRegistry() {
    // 1. Local Model
    const local = new LocalModelProvider();
    this.registerModel({
      id: "local-lfm-2.5",
      name: "LFM-2.5-Audio-Instruct",
      layer: "LOCAL",
      contextWindow: 8192,
      latencyTier: "ULTRA_LOW",
      capabilities: ["device_control", "audio_input", "offline", "fast_math", "privacy"],
      enabled: true,
      providerInstance: local
    });

    // 2. Server Model
    const server = new ServerModelProvider();
    this.registerModel({
      id: "server-muscal-core",
      name: "Muscal-Core-Executor",
      layer: "SERVER",
      contextWindow: 32768,
      latencyTier: "BALANCED",
      capabilities: ["file_sync", "syncthing", "sql_memory", "bash_tools", "orchestration"],
      enabled: true,
      providerInstance: server
    });

    // 3. Cloud Model (Gemini)
    const cloud = new CloudModelProvider();
    this.registerModel({
      id: "cloud-gemini-2.5",
      name: "Gemini 2.5 Flash",
      layer: "CLOUD",
      contextWindow: 1048576,
      latencyTier: "HIGH_CAPACITY",
      capabilities: ["complex_reasoning", "knowledge_synthesis", "coding", "creative", "vision"],
      enabled: true,
      providerInstance: cloud
    });
  }

  public registerModel(entry: ModelRegistryEntry): void {
    this.registry.set(entry.id, entry);
  }

  public getRegistry(): ModelRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  public setStrategy(strategy: RoutingStrategy): void {
    this.currentStrategy = strategy;
    auditLogger.log({
      category: "ROUTER",
      severity: "INFO",
      action: "ROUTING_STRATEGY_CHANGED",
      description: `AgentRouter strategy updated to ${strategy}`,
      actor: "USER",
      metadata: { strategy }
    });
  }

  public getStrategy(): RoutingStrategy {
    return this.currentStrategy;
  }

  /**
   * Evaluates query intent and dynamically selects the optimal model execution layer.
   */
  public analyzeAndRoute(query: string): RoutingDecision {
    const clean = query.trim().toLowerCase();

    // 1. Check explicit manual overrides
    if (this.currentStrategy === "FORCE_LOCAL") {
      const entry = this.getModelByLayer("LOCAL")!;
      return {
        selectedLayer: "LOCAL",
        selectedModel: entry.name,
        provider: entry.providerInstance,
        strategyUsed: "FORCE_LOCAL",
        confidence: 1.0,
        reason: "Forced by user preference to on-device LOCAL execution.",
        estimatedLatencyMs: 120
      };
    }

    if (this.currentStrategy === "FORCE_SERVER") {
      const entry = this.getModelByLayer("SERVER")!;
      return {
        selectedLayer: "SERVER",
        selectedModel: entry.name,
        provider: entry.providerInstance,
        strategyUsed: "FORCE_SERVER",
        confidence: 1.0,
        reason: "Forced by user preference to SERVER execution.",
        estimatedLatencyMs: 300
      };
    }

    if (this.currentStrategy === "FORCE_CLOUD") {
      const entry = this.getModelByLayer("CLOUD")!;
      return {
        selectedLayer: "CLOUD",
        selectedModel: entry.name,
        provider: entry.providerInstance,
        strategyUsed: "FORCE_CLOUD",
        confidence: 1.0,
        reason: "Forced by user preference to CLOUD Gemini API.",
        estimatedLatencyMs: 800
      };
    }

    // 2. Autonomous Intent-based Routing ("AUTO")
    // Rule A: Local / Device / Sensor / Audio / Offline indicators
    const localKeywords = [
      "device", "sensor", "mic", "microphone", "speaker", "audio", "camera",
      "screen", "webrtc", "p2p", "offline", "ping", "local", "volume", "battery",
      "fast", "calc", "math"
    ];
    if (localKeywords.some(k => clean.includes(k))) {
      const entry = this.getModelByLayer("LOCAL")!;
      return {
        selectedLayer: "LOCAL",
        selectedModel: entry.name,
        provider: entry.providerInstance,
        strategyUsed: "AUTO",
        confidence: 0.94,
        reason: "Targeted device control, local audio/sensor telemetry, or zero-latency edge reasoning.",
        estimatedLatencyMs: 140
      };
    }

    // Rule B: Server / Tool / Syncthing / File / Memory indicators
    const serverKeywords = [
      "file", "sync", "syncthing", "folder", "sqlite", "sql", "memory", "database",
      "bash", "command", "tool", "terminal", "server", "trace", "orchestrate"
    ];
    if (serverKeywords.some(k => clean.includes(k))) {
      const entry = this.getModelByLayer("SERVER")!;
      return {
        selectedLayer: "SERVER",
        selectedModel: entry.name,
        provider: entry.providerInstance,
        strategyUsed: "AUTO",
        confidence: 0.91,
        reason: "Matched backend server task: system tools, local file synchronizer, or structured memory.",
        estimatedLatencyMs: 320
      };
    }

    // Rule C: Default to Cloud (Gemini) for open-ended queries, coding, RAG reasoning, creative tasks
    const cloudEntry = this.getModelByLayer("CLOUD") || this.getModelByLayer("LOCAL")!;
    return {
      selectedLayer: cloudEntry.layer,
      selectedModel: cloudEntry.name,
      provider: cloudEntry.providerInstance,
      strategyUsed: "AUTO",
      confidence: 0.88,
      reason: "Complex reasoning, general knowledge query, or multi-step synthesis routed to Cloud LLM.",
      estimatedLatencyMs: 750
    };
  }

  /**
   * Intercepts a user query, routes it, executes it via the chosen provider,
   * logs the event to the AuditLogger, and returns the response with telemetry.
   */
  public async executeQuery(query: string, history: Message[]): Promise<{
    response: ModelResponse;
    decision: RoutingDecision;
    latencyMs: number;
  }> {
    const startTime = Date.now();
    const decision = this.analyzeAndRoute(query);

    // Audit log the routing interception
    auditLogger.log({
      category: "ROUTER",
      severity: "INFO",
      action: "QUERY_INTERCEPTED_AND_ROUTED",
      description: `Routed query to [${decision.selectedLayer}] using ${decision.selectedModel}`,
      actor: "ROUTER",
      metadata: {
        querySample: query.length > 60 ? `${query.substring(0, 60)}...` : query,
        layer: decision.selectedLayer,
        model: decision.selectedModel,
        reason: decision.reason,
        confidence: decision.confidence
      }
    });

    const messagesToSend: Message[] = [
      ...history,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
        timestamp: Date.now()
      }
    ];

    try {
      const response = await decision.provider.generateContent(messagesToSend);
      const latencyMs = Date.now() - startTime;

      auditLogger.log({
        category: "ROUTER",
        severity: "INFO",
        action: "MODEL_EXECUTION_COMPLETED",
        description: `Model ${decision.selectedModel} returned response in ${latencyMs}ms`,
        actor: decision.selectedLayer,
        metadata: { latencyMs, layer: decision.selectedLayer }
      });

      return {
        response,
        decision,
        latencyMs
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;

      auditLogger.log({
        category: "ROUTER",
        severity: "ERROR",
        action: "MODEL_EXECUTION_FAILED",
        description: `Execution failed on [${decision.selectedLayer}]: ${error.message || error}`,
        actor: decision.selectedLayer,
        metadata: { error: String(error), latencyMs }
      });

      // Graceful fallback to Local model if Cloud or Server fails
      if (decision.selectedLayer !== "LOCAL") {
        const localEntry = this.getModelByLayer("LOCAL");
        if (localEntry) {
          auditLogger.log({
            category: "ROUTER",
            severity: "WARN",
            action: "FAILOVER_TO_LOCAL",
            description: `Triggering automatic failover to local model ${localEntry.name}`,
            actor: "ROUTER"
          });
          const fallbackRes = await localEntry.providerInstance.generateContent(messagesToSend);
          return {
            response: {
              ...fallbackRes,
              content: `[Failover to Local Edge] ${fallbackRes.content}`
            },
            decision: {
              ...decision,
              selectedLayer: "LOCAL",
              selectedModel: localEntry.name,
              reason: `Failover from ${decision.selectedLayer} error: ${error.message}`
            },
            latencyMs: Date.now() - startTime
          };
        }
      }

      throw error;
    }
  }

  private getModelByLayer(layer: ExecutionLayer): ModelRegistryEntry | undefined {
    for (const entry of this.registry.values()) {
      if (entry.layer === layer && entry.enabled) {
        return entry;
      }
    }
    return undefined;
  }
}

export const agentRouter = AgentRouter.getInstance();
