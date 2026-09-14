/**
 * Context Engine Policy Contract.
 * Enforces token limits, sensitivity gates, and diversity rules when selecting evidence.
 */

import { AIDataPolicy, DEFAULT_LOCAL_ONLY_POLICY } from '@/ai/api/AIDataPolicy';

export interface ContextPolicy {
  readonly maxTokenBudget: number; // Maximum tokens allocated for assembled context
  readonly minConfidence: number; // Minimum confidence score (0.0 - 1.0)
  readonly maxEvidenceItems: number; // Hard ceiling on number of evidence items
  readonly allowedSensitivities: readonly ('public' | 'private' | 'sensitive')[];
  readonly allowedSourceTypes?: readonly string[];
  readonly deduplicationThreshold: number; // Similarity threshold for duplicate suppression
  readonly dataPolicy: AIDataPolicy;
}

export const DEFAULT_CONTEXT_POLICY: ContextPolicy = {
  maxTokenBudget: 2048,
  minConfidence: 0.35,
  maxEvidenceItems: 10,
  allowedSensitivities: ['public', 'private'],
  deduplicationThreshold: 0.90,
  dataPolicy: DEFAULT_LOCAL_ONLY_POLICY,
};
