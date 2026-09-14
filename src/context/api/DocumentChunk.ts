/**
 * Document Chunk Contract.
 * Deterministic textual segments created from RawDocuments with explicit sequence & offsets.
 */

export interface DocumentChunk {
  readonly chunkId: string;
  readonly documentId: string;
  readonly sourceId: string;
  readonly sequence: number;
  readonly text: string;
  readonly tokenEstimate: number;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly hash: string;
  readonly processingVersion: string;
}

export const CURRENT_CHUNK_PROCESSING_VERSION = '1.0.0';
