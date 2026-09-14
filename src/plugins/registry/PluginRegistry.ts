/**
 * Plugin Registry.
 * 
 * Manages plugin registrations, manifest validation, and identity separation.
 * Untrusted by default: registering a plugin does not mean it is trusted or enabled.
 */

import { PluginManifest, validatePluginManifest } from '../api/PluginManifest';
import { IPlugin } from '../api/Plugin';
import { PluginMetadata, PluginLifecycleState } from './PluginMetadata';
import { PluginCapabilityKey } from '../api/PluginCapability';
import { logger } from '@/core/logging/Logger';
import { eventBus } from '@/core/events/EventBus';

export class PluginRegistryError extends Error {
  constructor(message: string, public readonly code: string = 'REGISTRY_ERROR') {
    super(message);
    this.name = 'PluginRegistryError';
  }
}

export class PluginRegistry {
  private static instance: PluginRegistry | null = null;

  // pluginId -> PluginMetadata
  private entries = new Map<string, PluginMetadata>();
  // pluginId -> IPlugin instance (if provided in-process)
  private instances = new Map<string, IPlugin>();

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Registers a plugin manifest and optional implementation.
   * Performs strict validation and duplicate checks.
   */
  public register(rawManifest: unknown, instance?: IPlugin): PluginMetadata {
    const validation = validatePluginManifest(rawManifest);
    if (!validation.valid || !validation.sanitizedManifest) {
      throw new PluginRegistryError(
        `Failed to register plugin: validation errors: [${validation.errors.join('; ')}]`,
        'MANIFEST_INVALID'
      );
    }

    const manifest = validation.sanitizedManifest;

    // Check for duplicate ID
    if (this.entries.has(manifest.id)) {
      throw new PluginRegistryError(
        `A plugin with ID "${manifest.id}" is already registered`,
        'DUPLICATE_PLUGIN_ID'
      );
    }

    const metadata: PluginMetadata = {
      manifest,
      lifecycleState: 'registered',
      registeredAt: Date.now(),
      stats: {
        activations: 0,
        invocations: 0,
        errors: 0,
      },
    };

    this.entries.set(manifest.id, metadata);

    if (instance) {
      this.instances.set(manifest.id, instance);
    }

    logger.info('PluginRegistry', `Plugin registered: ${manifest.id} (v${manifest.version}) by ${manifest.publisher}`);
    eventBus.emit('plugin:registered', { pluginId: manifest.id, metadata });

    return metadata;
  }

  public get(pluginId: string): PluginMetadata | undefined {
    return this.entries.get(pluginId);
  }

  public getInstance(pluginId: string): IPlugin | undefined {
    return this.instances.get(pluginId);
  }

  public has(pluginId: string): boolean {
    return this.entries.has(pluginId);
  }

  public getAll(): PluginMetadata[] {
    return Array.from(this.entries.values());
  }

  public getByCapability(cap: PluginCapabilityKey): PluginMetadata[] {
    return this.getAll().filter((m) => m.manifest.capabilities.includes(cap));
  }

  public getByState(state: PluginLifecycleState): PluginMetadata[] {
    return this.getAll().filter((m) => m.lifecycleState === state);
  }

  public updateState(pluginId: string, newState: PluginLifecycleState, error?: string): void {
    const entry = this.entries.get(pluginId);
    if (!entry) {
      throw new PluginRegistryError(`Plugin "${pluginId}" not found in registry`, 'PLUGIN_NOT_FOUND');
    }

    const previousState = entry.lifecycleState;
    entry.lifecycleState = newState;

    const now = Date.now();
    if (newState === 'validated') entry.validatedAt = now;
    if (newState === 'enabled') entry.enabledAt = now;
    if (newState === 'disabled') entry.disabledAt = now;
    if (newState === 'failed') {
      entry.failedAt = now;
      entry.lastError = error;
      entry.stats.errors++;
    }

    logger.info('PluginRegistry', `Plugin "${pluginId}" transitioned: ${previousState} -> ${newState}`);
    eventBus.emit('plugin:state_changed', { pluginId, previousState, newState, error });
  }

  public delete(pluginId: string): boolean {
    const removedEntry = this.entries.delete(pluginId);
    this.instances.delete(pluginId);
    if (removedEntry) {
      logger.info('PluginRegistry', `Plugin "${pluginId}" removed from registry`);
      eventBus.emit('plugin:unregistered', { pluginId });
    }
    return removedEntry;
  }

  public clear(): void {
    this.entries.clear();
    this.instances.clear();
  }
}
