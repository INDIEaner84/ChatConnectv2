/**
 * Embedding Provider Contract.
 * Generates vector representations of textual content for semantic search and retrieval.
 */

import { IAIProvider } from './AIProvider';

export interface EmbeddingResult {
  readonly vector: readonly number[];
  readonly dimensions: number;
  readonly tokenEstimate: number;
}

export interface IEmbeddingProvider extends IAIProvider {
  readonly modelId: string;
  readonly modelVersion: string;
  readonly dimensions: number;

  /**
   * Embeds a single text snippet.
   */
  embed(text: string): Promise<EmbeddingResult>;

  /**
   * Batch embeds multiple text snippets.
   */
  embedBatch(texts: readonly string[]): Promise<readonly EmbeddingResult[]>;
}
