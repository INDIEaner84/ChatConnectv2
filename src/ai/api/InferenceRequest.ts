/**
 * Neutral Inference Request Contract.
 * Agnostic input structure passed to any ModelProvider.
 */

import { AIDataPolicy, DEFAULT_LOCAL_ONLY_POLICY } from './AIDataPolicy';

export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  readonly content: string;
  readonly name?: string;
  readonly toolCalls?: readonly unknown[];
}

export interface InferenceParameters {
  readonly temperature?: number;
  readonly topP?: number;
  readonly maxTokens?: number;
  readonly stopSequences?: readonly string[];
  readonly jsonSchema?: Record<string, unknown>;
  readonly stream?: boolean;
}

export interface InferenceRequest {
  readonly id: string;
  readonly modelId?: string; // Optional: router can assign if not fixed
  readonly messages: readonly ChatMessage[];
  readonly parameters?: InferenceParameters;
  readonly policy?: AIDataPolicy;
  readonly signal?: AbortSignal;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly onChunk?: (chunkText: string, delta: unknown) => void;
}

export function createInferenceRequest(
  promptOrMessages: string | readonly ChatMessage[],
  options?: Partial<InferenceRequest>
): InferenceRequest {
  const messages: ChatMessage[] = typeof promptOrMessages === 'string'
    ? [{ role: 'user', content: promptOrMessages }]
    : [...promptOrMessages];

  return {
    id: options?.id || `inf_req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    modelId: options?.modelId,
    messages,
    parameters: options?.parameters,
    policy: options?.policy || DEFAULT_LOCAL_ONLY_POLICY,
    signal: options?.signal,
    metadata: options?.metadata || {},
    onChunk: options?.onChunk,
  };
}
