/**
 * Retriever & Reranker Provider Contracts.
 * Supports lexical (keyword), semantic (embedding), hybrid, and late-interaction retrieval.
 */

import { IAIProvider } from './AIProvider';

export type RetrievalStrategy = 'keyword' | 'semantic' | 'hybrid' | 'late-interaction';

export interface RetrievalCandidate {
  readonly chunkId: string;
  readonly documentId: string;
  readonly score: number;
  readonly text: string;
  readonly metadata?: Record<string, unknown>;
  readonly matchStrategy: RetrievalStrategy;
}

export interface RetrievalQuery {
  readonly query: string;
  readonly limit?: number;
  readonly minScore?: number;
  readonly filterDocumentIds?: readonly string[];
  readonly strategy?: RetrievalStrategy;
}

export interface IRetrieverProvider extends IAIProvider {
  readonly supportedStrategies: readonly RetrievalStrategy[];

  /**
   * Retrieves candidate matches for a query.
   */
  retrieve(query: RetrievalQuery): Promise<readonly RetrievalCandidate[]>;
}

/**
 * Late Interaction Retriever (ColBERT style multi-vector token scoring).
 * Prepared contract for fine-grained token-level token-to-token similarity.
 */
export interface ILateInteractionRetriever extends IRetrieverProvider {
  readonly maxTokensPerDoc: number;
  scoreLateInteraction(
    queryTokens: readonly number[][],
    docTokens: readonly number[][]
  ): Promise<number>;
}

/**
 * Reranker contract.
 * Re-scores and re-orders candidate evidence items for maximum relevance and diversity.
 */
export interface IReranker extends IAIProvider {
  rerank(
    query: string,
    candidates: readonly RetrievalCandidate[],
    topK?: number
  ): Promise<readonly RetrievalCandidate[]>;
}
