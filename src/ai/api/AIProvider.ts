/**
 * Base AI Provider Contracts.
 * Supports swappable LOCAL and REMOTE execution backends.
 */

export type ProviderExecutionType = 'LOCAL' | 'REMOTE';

export interface ProviderHealth {
  readonly healthy: boolean;
  readonly latencyMs?: number;
  readonly message?: string;
  readonly activeRequests: number;
}

export interface IAIProvider {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly type: ProviderExecutionType;
  readonly description?: string;
  
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getHealth(): Promise<ProviderHealth>;
}
