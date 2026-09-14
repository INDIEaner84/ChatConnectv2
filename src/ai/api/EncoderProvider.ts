/**
 * Encoder Provider Contract.
 * Provides tokenization, token estimation, and representation encoding.
 */

import { IAIProvider } from './AIProvider';

export interface TokenEncodingResult {
  readonly tokens: readonly number[];
  readonly tokenCount: number;
}

export interface IEncoderProvider extends IAIProvider {
  readonly modelId: string;

  /**
   * Estimates token count for text.
   */
  estimateTokens(text: string): number;

  /**
   * Encodes text into numerical token sequence.
   */
  encode(text: string): Promise<TokenEncodingResult>;

  /**
   * Decodes tokens back to text.
   */
  decode(tokens: readonly number[]): Promise<string>;

  /**
   * Truncates text to within maxTokens budget.
   */
  truncateToTokenLimit(text: string, maxTokens: number): string;
}
