/**
 * Plugin Capability model and contract definitions.
 * 
 * Capabilities represent the functional interfaces exposed to plugins.
 * Every capability maps to one or more required permissions.
 */

import { PluginPermission } from './PluginPermission';
import { IPluginStorage } from '../storage/PluginStorage';

export const PLUGIN_CAPABILITIES = [
  'ui.panel',
  'ui.menu',
  'ui.widget',
  'messaging.read',
  'messaging.send',
  'contacts.read',
  'storage.plugin',
  'network.request',
  'ai.inference',
  'ai.context',
  'ai.tool',
  'location.approximate',
  'filesystem.user-selected',
] as const;

export type PluginCapabilityKey = (typeof PLUGIN_CAPABILITIES)[number];

export const CAPABILITY_REQUIRED_PERMISSIONS: Record<PluginCapabilityKey, PluginPermission[]> = {
  'ui.panel': ['ui:panel'],
  'ui.menu': ['ui:menu'],
  'ui.widget': ['ui:widget'],
  'messaging.read': ['messaging:read'],
  'messaging.send': ['messaging:send'],
  'contacts.read': ['contacts:read'],
  'storage.plugin': ['storage:plugin'],
  'network.request': ['network:request'],
  'ai.inference': ['ai:inference'],
  'ai.context': ['ai:context'],
  'ai.tool': ['ai:tool'],
  'location.approximate': ['location:approximate'],
  'filesystem.user-selected': ['filesystem:user-selected'],
};

export function isPluginCapabilityKey(val: string): val is PluginCapabilityKey {
  return (PLUGIN_CAPABILITIES as readonly string[]).includes(val);
}

// ============================================================
// Capability Functional Contracts (Client-facing sanitized APIs)
// ============================================================

export interface SanitizedPeerContact {
  readonly id: string;
  readonly displayName: string;
  readonly publicIdentity: string;
  readonly avatar?: string;
  readonly establishedAt: number;
}

export interface SanitizedConversationSummary {
  readonly id: string;
  readonly type: 'direct' | 'group';
  readonly title: string;
  readonly participantCount: number;
  readonly lastActivityAt: number;
}

export interface OutboundMessageRequest {
  readonly conversationId: string;
  readonly content: string;
  readonly metadata?: Record<string, string | number | boolean>;
}

export interface OutboundNetworkRequest {
  readonly url: string;
  readonly method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly headers?: Record<string, string>;
  readonly body?: string;
  readonly timeoutMs?: number;
}

export interface NetworkResponseData {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly data: string;
}

export interface AIInferenceRequest {
  readonly prompt: string;
  readonly systemPrompt?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

export interface AIInferenceResult {
  readonly text: string;
  readonly usage?: { promptTokens: number; completionTokens: number };
}

export interface AIToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface ApproximateLocationResult {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyKm: number;
  readonly countryCode?: string;
}

export interface UserSelectedFileResult {
  readonly name: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
  readonly dataBase64: string;
}

/**
 * Access broker interface provided via PluginContext to access capabilities.
 */
export interface ICapabilityAccess {
  getStorage(): IPluginStorage;
  readContacts(): Promise<SanitizedPeerContact[]>;
  readConversations(): Promise<SanitizedConversationSummary[]>;
  sendMessage(req: OutboundMessageRequest): Promise<{ messageId: string; status: string }>;
  fetchNetwork(req: OutboundNetworkRequest): Promise<NetworkResponseData>;
  runInference(req: AIInferenceRequest): Promise<AIInferenceResult>;
  registerTool(tool: AIToolDefinition): void;
  getApproximateLocation(): Promise<ApproximateLocationResult>;
  requestUserFile(acceptMimeTypes?: string[]): Promise<UserSelectedFileResult | null>;
}
