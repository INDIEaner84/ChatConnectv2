/**
 * Model Metadata & Descriptor Contracts.
 * Neutral, model-agnostic specifications for all AI models registered in Chat Connect.
 */

export const MODEL_TYPES = [
  'instruct',
  'thinking',
  'encoder',
  'embedding',
  'extractor',
  'reranker',
  'vision',
  'audio',
  'multimodal',
] as const;

export type ModelType = (typeof MODEL_TYPES)[number];

export const MODEL_MODALITIES = ['text', 'image', 'audio', 'embedding', 'structured'] as const;
export type ModelModality = (typeof MODEL_MODALITIES)[number];

export type ModelQuantization = 'fp32' | 'fp16' | 'q8' | 'q4' | 'q2' | 'none';

export type ModelRuntimeEnvironment = 'wasm' | 'webgpu' | 'webworker' | 'native' | 'cloud' | 'api';

export interface ModelHardwareRequirements {
  readonly minRamMb: number;
  readonly recommendedRamMb: number;
  readonly minCores?: number;
  readonly requiresWebGPU?: boolean;
  readonly requiresWASM?: boolean;
  readonly requiresNPU?: boolean;
  readonly estimatedDownloadSizeMb?: number;
}

export interface ModelDescriptor {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly provider: string; // provider ID
  readonly type: ModelType;
  readonly parameterCount?: string; // e.g. "0.5B", "1.5B", "7B"
  readonly contextLength: number; // in tokens
  readonly modalities: readonly ModelModality[];
  readonly quantization: ModelQuantization;
  readonly runtime: ModelRuntimeEnvironment;
  readonly license: string;
  readonly local: boolean;
  readonly remote: boolean;
  readonly requirements: ModelHardwareRequirements;
  readonly capabilities: readonly string[]; // e.g. ["chat", "streaming", "json_schema", "function_calling"]
  readonly costPer1kTokens?: { input: number; output: number };
  readonly description?: string;
}

export type ModelStatus =
  | 'available'
  | 'installed'
  | 'downloading'
  | 'loading'
  | 'unavailable'
  | 'error';

export interface ModelRegistrationRecord {
  readonly descriptor: ModelDescriptor;
  readonly status: ModelStatus;
  readonly registeredAt: number;
  readonly lastUsedAt?: number;
  readonly loadError?: string;
}
