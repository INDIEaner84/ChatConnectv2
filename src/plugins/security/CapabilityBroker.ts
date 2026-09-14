/**
 * Capability Broker.
 * 
 * Sits strictly between the PluginContext and Core APIs:
 * PLUGIN -> PluginContext -> CapabilityBroker -> PermissionManager -> Core API
 * 
 * Plugins have ZERO direct access to internal Core implementations, database connections,
 * private identity keys, or raw transport sockets.
 */

import {
  PluginCapabilityKey,
  CAPABILITY_REQUIRED_PERMISSIONS,
  ICapabilityAccess,
  SanitizedPeerContact,
  SanitizedConversationSummary,
  OutboundMessageRequest,
  OutboundNetworkRequest,
  NetworkResponseData,
  AIInferenceRequest,
  AIInferenceResult,
  AIToolDefinition,
  ApproximateLocationResult,
  UserSelectedFileResult,
} from '../api/PluginCapability';
import { PermissionManager } from './PermissionManager';
import { PluginRegistry } from '../registry/PluginRegistry';
import { PluginStorageManager, IPluginStorage } from '../storage/PluginStorage';
import { PluginSecurityPolicy, PluginSecurityException } from './PluginSecurityPolicy';
import { logger } from '@/core/logging/Logger';
import { eventBus } from '@/core/events/EventBus';

export interface AuditLogEntry {
  readonly timestamp: number;
  readonly pluginId: string;
  readonly capability: PluginCapabilityKey;
  readonly operation: string;
  readonly outcome: 'granted' | 'denied' | 'failed' | 'executed';
  readonly details?: Record<string, unknown>;
}

export class CapabilityBroker {
  private static instance: CapabilityBroker | null = null;
  private auditLogs: AuditLogEntry[] = [];
  private registeredTools = new Map<string, { pluginId: string; tool: AIToolDefinition }>();

  constructor(
    private registry: PluginRegistry = PluginRegistry.getInstance(),
    private permissions: PermissionManager = PermissionManager.getInstance(),
    private storageManager: PluginStorageManager = PluginStorageManager.getInstance()
  ) {}

  public static getInstance(): CapabilityBroker {
    if (!CapabilityBroker.instance) {
      CapabilityBroker.instance = new CapabilityBroker();
    }
    return CapabilityBroker.instance;
  }

  /**
   * Generates a sandboxed ICapabilityAccess adapter specifically bound to a pluginId.
   */
  public createCapabilityAccess(pluginId: string): ICapabilityAccess {
    return {
      getStorage: () => this.getStorage(pluginId),
      readContacts: () => this.readContacts(pluginId),
      readConversations: () => this.readConversations(pluginId),
      sendMessage: (req) => this.sendMessage(pluginId, req),
      fetchNetwork: (req) => this.fetchNetwork(pluginId, req),
      runInference: (req) => this.runInference(pluginId, req),
      registerTool: (tool) => this.registerTool(pluginId, tool),
      getApproximateLocation: () => this.getApproximateLocation(pluginId),
      requestUserFile: (accept) => this.requestUserFile(pluginId, accept),
    };
  }

  // ============================================================
  // Core Capability Handlers
  // ============================================================

  public getStorage(pluginId: string): IPluginStorage {
    this.assertCapabilityAuthorized(pluginId, 'storage.plugin', 'getStorage');
    return this.storageManager.getStorage(pluginId);
  }

  public async readContacts(pluginId: string): Promise<SanitizedPeerContact[]> {
    this.assertCapabilityAuthorized(pluginId, 'contacts.read', 'readContacts');

    this.logAudit({
      timestamp: Date.now(),
      pluginId,
      capability: 'contacts.read',
      operation: 'readContacts',
      outcome: 'executed',
    });

    // In a live system, queries ContactRepository and sanitizes results:
    // Only public fields (id, displayName, publicIdentity, avatar, establishedAt)
    // NEVER private keys, secrets, or internal device tokens!
    return [];
  }

  public async readConversations(pluginId: string): Promise<SanitizedConversationSummary[]> {
    this.assertCapabilityAuthorized(pluginId, 'messaging.read', 'readConversations');

    this.logAudit({
      timestamp: Date.now(),
      pluginId,
      capability: 'messaging.read',
      operation: 'readConversations',
      outcome: 'executed',
    });

    // Sanitized high-level summary only
    return [];
  }

  public async sendMessage(
    pluginId: string,
    req: OutboundMessageRequest
  ): Promise<{ messageId: string; status: string }> {
    this.assertCapabilityAuthorized(pluginId, 'messaging.send', 'sendMessage');

    if (!req.conversationId || !req.content) {
      throw new PluginSecurityException('conversationId and content are required', 'INVALID_MESSAGE_REQUEST');
    }

    if (req.content.length > 4000) {
      throw new PluginSecurityException('Message content exceeds maximum allowed length (4000 characters)', 'CONTENT_TOO_LARGE');
    }

    const messageId = `msg_ext_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.logAudit({
      timestamp: Date.now(),
      pluginId,
      capability: 'messaging.send',
      operation: 'sendMessage',
      outcome: 'executed',
      details: { conversationId: req.conversationId, length: req.content.length },
    });

    // Dispatches via standard Core EventBus without exposing private keys
    eventBus.emit('plugin:outbound_message', {
      pluginId,
      messageId,
      conversationId: req.conversationId,
      content: req.content,
    });

    return { messageId, status: 'queued' };
  }

  public async fetchNetwork(
    pluginId: string,
    req: OutboundNetworkRequest
  ): Promise<NetworkResponseData> {
    this.assertCapabilityAuthorized(pluginId, 'network.request', 'fetchNetwork');

    // Strict URL and protocol check (HTTPS / WSS only)
    const parsedUrl = PluginSecurityPolicy.validateOutboundUrl(req.url);

    this.logAudit({
      timestamp: Date.now(),
      pluginId,
      capability: 'network.request',
      operation: 'fetchNetwork',
      outcome: 'executed',
      details: { host: parsedUrl.host, protocol: parsedUrl.protocol, method: req.method ?? 'GET' },
    });

    // Perform controlled fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), req.timeoutMs ?? 15000);

    try {
      const resp = await fetch(parsedUrl.toString(), {
        method: req.method ?? 'GET',
        headers: req.headers,
        body: req.body,
        signal: controller.signal,
      });

      const data = await resp.text();
      const headersRecord: Record<string, string> = {};
      resp.headers.forEach((val, key) => {
        headersRecord[key] = val;
      });

      return {
        status: resp.status,
        statusText: resp.statusText,
        headers: headersRecord,
        data,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new PluginSecurityException(`Network request failed: ${errMsg}`, 'NETWORK_FETCH_ERROR');
    } finally {
      clearTimeout(timeout);
    }
  }

  public async runInference(
    pluginId: string,
    req: AIInferenceRequest
  ): Promise<AIInferenceResult> {
    this.assertCapabilityAuthorized(pluginId, 'ai.inference', 'runInference');

    if (!req.prompt || typeof req.prompt !== 'string') {
      throw new PluginSecurityException('Prompt is required', 'INVALID_PROMPT');
    }

    this.logAudit({
      timestamp: Date.now(),
      pluginId,
      capability: 'ai.inference',
      operation: 'runInference',
      outcome: 'executed',
      details: { promptLength: req.prompt.length },
    });

    return {
      text: `[AI Inference placeholder for ${pluginId}]`,
      usage: { promptTokens: req.prompt.length / 4, completionTokens: 8 },
    };
  }

  public registerTool(pluginId: string, tool: AIToolDefinition): void {
    this.assertCapabilityAuthorized(pluginId, 'ai.tool', 'registerTool');

    if (!tool.name || typeof tool.handler !== 'function') {
      throw new PluginSecurityException('Tool must have a valid name and handler function', 'INVALID_TOOL');
    }

    const toolKey = `${pluginId}::${tool.name}`;
    this.registeredTools.set(toolKey, { pluginId, tool });

    this.logAudit({
      timestamp: Date.now(),
      pluginId,
      capability: 'ai.tool',
      operation: 'registerTool',
      outcome: 'executed',
      details: { toolName: tool.name },
    });

    logger.info('CapabilityBroker', `Tool "${tool.name}" registered by plugin ${pluginId}`);
  }

  public async getApproximateLocation(pluginId: string): Promise<ApproximateLocationResult> {
    this.assertCapabilityAuthorized(pluginId, 'location.approximate', 'getApproximateLocation');

    this.logAudit({
      timestamp: Date.now(),
      pluginId,
      capability: 'location.approximate',
      operation: 'getApproximateLocation',
      outcome: 'executed',
    });

    // Approximate low-resolution location
    return {
      latitude: 52.52,
      longitude: 13.405,
      accuracyKm: 25,
      countryCode: 'DE',
    };
  }

  public async requestUserFile(
    pluginId: string,
    acceptMimeTypes?: string[]
  ): Promise<UserSelectedFileResult | null> {
    this.assertCapabilityAuthorized(pluginId, 'filesystem.user-selected', 'requestUserFile');

    this.logAudit({
      timestamp: Date.now(),
      pluginId,
      capability: 'filesystem.user-selected',
      operation: 'requestUserFile',
      outcome: 'executed',
      details: { accept: acceptMimeTypes },
    });

    return null;
  }

  // ============================================================
  // Security Verification & Audit
  // ============================================================

  public assertCapabilityAuthorized(
    pluginId: string,
    capability: PluginCapabilityKey,
    operation: string
  ): void {
    const meta = this.registry.get(pluginId);
    if (!meta) {
      this.logAudit({
        timestamp: Date.now(),
        pluginId,
        capability,
        operation,
        outcome: 'denied',
        details: { reason: 'Plugin not registered' },
      });
      throw new PluginSecurityException(`Plugin "${pluginId}" is not registered`, 'PLUGIN_NOT_FOUND');
    }

    // 1. Must be enabled
    if (meta.lifecycleState !== 'enabled') {
      this.logAudit({
        timestamp: Date.now(),
        pluginId,
        capability,
        operation,
        outcome: 'denied',
        details: { reason: `Plugin lifecycle is "${meta.lifecycleState}", must be "enabled"` },
      });
      throw new PluginSecurityException(
        `Plugin "${pluginId}" cannot use capability "${capability}" because its state is "${meta.lifecycleState}"`,
        'PLUGIN_NOT_ENABLED'
      );
    }

    // 2. Manifest must declare the capability
    if (!meta.manifest.capabilities.includes(capability)) {
      this.logAudit({
        timestamp: Date.now(),
        pluginId,
        capability,
        operation,
        outcome: 'denied',
        details: { reason: 'Capability not declared in manifest' },
      });
      throw new PluginSecurityException(
        `Capability "${capability}" was not declared in manifest for "${pluginId}"`,
        'CAPABILITY_NOT_DECLARED'
      );
    }

    // 3. PermissionManager must have granted the required permission
    const requiredPermissions = CAPABILITY_REQUIRED_PERMISSIONS[capability] ?? [];
    for (const perm of requiredPermissions) {
      if (!this.permissions.hasPermission(pluginId, perm)) {
        this.logAudit({
          timestamp: Date.now(),
          pluginId,
          capability,
          operation,
          outcome: 'denied',
          details: { missingPermission: perm },
        });
        throw new PluginSecurityException(
          `Permission "${perm}" required for capability "${capability}" is not granted to "${pluginId}"`,
          'PERMISSION_NOT_GRANTED'
        );
      }
    }
  }

  public getAuditLogs(pluginId?: string): AuditLogEntry[] {
    if (!pluginId) return [...this.auditLogs];
    return this.auditLogs.filter((l) => l.pluginId === pluginId);
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
  }

  private logAudit(entry: AuditLogEntry): void {
    const sanitizedEntry: AuditLogEntry = {
      ...entry,
      details: entry.details ? PluginSecurityPolicy.sanitizeAuditLogPayload(entry.details) : undefined,
    };
    this.auditLogs.push(sanitizedEntry);
    if (this.auditLogs.length > 1000) {
      this.auditLogs.shift();
    }
  }
}
