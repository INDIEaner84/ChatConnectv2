/**
 * Extractor Provider Contract.
 * Normalizes, parses, and extracts structured entities and summaries from raw documents.
 */

import { IAIProvider } from './AIProvider';

export interface ExtractedEntity {
  readonly type: string;
  readonly value: string;
  readonly confidence: number;
  readonly startOffset?: number;
  readonly endOffset?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface ExtractionResult {
  readonly summary: string;
  readonly topics: readonly string[];
  readonly entities: readonly ExtractedEntity[];
  readonly language?: string;
  readonly mimeType?: string;
  readonly metadata: Record<string, unknown>;
}

export interface IExtractorProvider extends IAIProvider {
  readonly modelId: string;

  /**
   * Extracts structured information from normalized document text.
   */
  extract(text: string, mimeType?: string): Promise<ExtractionResult>;
}
