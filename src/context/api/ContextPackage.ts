/**
 * Context Package Contract.
 * Structured context object provided to the Model Router & AI Providers.
 * Not a raw string, but a rich, verifiable structure with provenance and policy decision.
 */

import { EvidenceObject, ProvenanceTrace } from './EvidenceObject';
import { EvidenceSource } from './EvidenceSource';
import { AIDataPolicy } from '@/ai/api/AIDataPolicy';

export interface ContextPolicyDecision {
  readonly allowed: boolean;
  readonly sensitivityLevel: 'public' | 'private' | 'sensitive';
  readonly remoteDispatchPermitted: boolean;
  readonly appliedDeduplicationCount: number;
  readonly droppedLowConfidenceCount: number;
  readonly reasoning?: string;
}

export interface ContextPackage {
  readonly id: string;
  readonly query: string;
  readonly evidence: readonly EvidenceObject[];
  readonly sources: readonly EvidenceSource[];
  readonly tokenEstimate: number;
  readonly createdAt: number;
  readonly pipelineVersion: string;
  readonly retrievalMetadata: Readonly<Record<string, unknown>>;
  readonly provenance: readonly ProvenanceTrace[];
  readonly policyDecision: ContextPolicyDecision;
}

export const CURRENT_PIPELINE_VERSION = '1.0.0';
