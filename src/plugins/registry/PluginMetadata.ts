/**
 * Plugin Metadata and Lifecycle States.
 */

import { PluginManifest } from '../api/PluginManifest';

export type PluginLifecycleState =
  | 'registered'
  | 'validated'
  | 'enabled'
  | 'disabled'
  | 'failed'
  | 'uninstalled'
  | 'quarantined';

export interface PluginExecutionStats {
  activations: number;
  invocations: number;
  errors: number;
  lastActiveAt?: number;
}

export interface PluginMetadata {
  readonly manifest: PluginManifest;
  lifecycleState: PluginLifecycleState;
  registeredAt: number;
  validatedAt?: number;
  enabledAt?: number;
  disabledAt?: number;
  failedAt?: number;
  lastError?: string;
  isBuiltin?: boolean;
  stats: PluginExecutionStats;
}
