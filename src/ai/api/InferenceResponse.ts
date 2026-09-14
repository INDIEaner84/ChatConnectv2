/**
 * Neutral Inference Response Contract.
 * Agnostic output returned from ModelProvider inference calls.
 */

export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface InferenceErrorDetails {
  readonly code: string;
  readonly message: string;
  readonly recoverable: boolean;
  readonly details?: unknown;
}

export interface InferenceResponse {
  readonly id: string;
  readonly requestId: string;
  readonly modelId: string;
  readonly providerId: string;
  readonly content: string;
  readonly role: 'assistant';
  readonly finishReason: 'stop' | 'length' | 'cancelled' | 'content_filter' | 'error';
  readonly usage?: TokenUsage;
  readonly latencyMs: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly error?: InferenceErrorDetails;
}
