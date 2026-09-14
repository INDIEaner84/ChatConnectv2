/**
 * Evidence Object & Provenance Contract.
 * Represents verified, contextual evidence ready for context pack assembly.
 * Enables end-to-end provenance: Query -> Evidence -> Chunk -> Document -> Original Source.
 */

import { AIDataPolicy } from '@/ai/api/AIDataPolicy';

export interface ProvenanceTrace {
  readonly queryId?: string;
  readonly evidenceId: string;
  readonly chunkId: string;
  readonly documentId: string;
  readonly sourceId: string;
  readonly origin: string;
  readonly extractionPipelineVersion: string;
  readonly verifiedAt: number;
}

export type EvidenceType = 'text' | 'fact' | 'quote' | 'summary' | 'entity' | 'code';

export interface EvidenceObject {
  readonly evidenceId: string;
  readonly sourceId: string;
  readonly documentId: string;
  readonly chunkId: string;
  readonly content: string;
  readonly type: EvidenceType;
  readonly provenance: ProvenanceTrace;
  readonly confidence: number; // 0.0 to 1.0
  readonly createdAt: number;
  readonly contentHash: string;
  readonly sensitivity: 'public' | 'private' | 'sensitive';
  readonly policy: AIDataPolicy;
  readonly metadata: Readonly<Record<string, unknown>>;
}
