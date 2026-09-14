/**
 * MUSCAL Future Architectural Interface Specifications.
 * Prepared modular boundaries for subsequent runtime tiers.
 * DO NOT directly instantiate heavy ML models here (Phase 1-4 scope restriction).
 */

export interface IModelMetadata {
  id: string;
  name: string;
  tier: 'local' | 'edge' | 'server' | 'cloud';
  parameters?: string;
  quantization?: string;
  capabilities: ('text' | 'vision' | 'audio' | 'embeddings')[];
  contextWindow: number;
  isAvailable: boolean;
}

export interface IModelRegistry {
  registerModel(metadata: IModelMetadata): void;
  unregisterModel(id: string): void;
  listModels(): IModelMetadata[];
  getModel(id: string): IModelMetadata | null;
}

export interface IModelManager {
  loadModel(modelId: string): Promise<boolean>;
  unloadModel(modelId: string): Promise<boolean>;
  getActiveModel(): IModelMetadata | null;
}

export interface IEncoder {
  encode(input: string): Promise<Float32Array>;
  getDimension(): number;
}

export interface IExtractor {
  extractFeatures(input: unknown): Promise<Record<string, unknown>>;
}

export interface IEmbeddingsEngine {
  embed(texts: string[]): Promise<Float32Array[]>;
}

export interface IColBERTScorer {
  score(queryEmbeddings: Float32Array[], docEmbeddings: Float32Array[]): number;
}

export interface IContextEngine {
  assembleContext(conversationId: string, query: string, maxTokens: number): Promise<string>;
  pruneContext(history: unknown[], tokenLimit: number): unknown[];
}

export interface IModelRouter {
  route(prompt: string, constraints: { latencyMs?: number; requiresVision?: boolean }): Promise<string>;
}

export interface IVoiceRuntime {
  startListening(): Promise<void>;
  stopListening(): Promise<string>;
  synthesizeSpeech(text: string): Promise<ArrayBuffer>;
}

export interface IVisionRuntime {
  processFrame(imageData: ImageData): Promise<{ labels: string[]; description?: string }>;
}

export interface IUIChangeEngine {
  proposeUIChange(diff: Record<string, unknown>): Promise<boolean>;
  applyUIChange(diff: Record<string, unknown>): Promise<void>;
}

export interface IChangeCollisionEngine {
  detectCollision(incomingChange: unknown, currentBranch: unknown): boolean;
  resolveCollision(resolutionStrategy: 'local-wins' | 'remote-wins' | 'muscal-merge'): Promise<void>;
}

export interface IUpdateManager {
  checkForUpdates(): Promise<{ hasUpdate: boolean; version?: string }>;
  applyUpdate(): Promise<void>;
}

export interface IMREIL {
  // MUSCAL Runtime Execution Intermediate Language
  executeInstruction(instruction: string, params: Record<string, unknown>): Promise<unknown>;
}

export interface IPromptCompiler {
  compile(template: string, variables: Record<string, unknown>): string;
}
