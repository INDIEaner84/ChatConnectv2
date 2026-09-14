/**
 * Plugin Runtime.
 * 
 * Orchestrates plugin lifecycle:
 * registered -> validated -> enabled -> disabled -> failed -> uninstalled
 * 
 * Strict Error Isolation:
 * Faulty plugins or thrown exceptions CANNOT crash the host application.
 */

import { PluginManifest } from '../api/PluginManifest';
import { IPlugin } from '../api/Plugin';
import { PluginContext, PluginUIContext, IPluginLogger } from '../api/PluginContext';
import { PluginResult, PluginResults } from '../api/PluginResult';
import { PluginRegistry } from '../registry/PluginRegistry';
import { PluginMetadata } from '../registry/PluginMetadata';
import { PermissionManager } from '../security/PermissionManager';
import { CapabilityBroker } from '../security/CapabilityBroker';
import { PluginStorageManager } from '../storage/PluginStorage';
import { UIExtensionRegistry } from '../ui/UIExtensionPoint';
import { logger } from '@/core/logging/Logger';

export class PluginRuntime {
  private static instance: PluginRuntime | null = null;
  private cleanups = new Map<string, Array<() => void | Promise<void>>>();

  constructor(
    private registry: PluginRegistry = PluginRegistry.getInstance(),
    private permissions: PermissionManager = PermissionManager.getInstance(),
    private broker: CapabilityBroker = CapabilityBroker.getInstance(),
    private storageManager: PluginStorageManager = PluginStorageManager.getInstance(),
    private uiRegistry: UIExtensionRegistry = UIExtensionRegistry.getInstance()
  ) {}

  public static getInstance(): PluginRuntime {
    if (!PluginRuntime.instance) {
      PluginRuntime.instance = new PluginRuntime();
    }
    return PluginRuntime.instance;
  }

  /**
   * Load: registers a plugin manifest and optional runtime instance.
   */
  public async load(manifest: unknown, instance?: IPlugin): Promise<PluginResult<PluginMetadata>> {
    try {
      const meta = this.registry.register(manifest, instance);
      return PluginResults.ok(meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('PluginRuntime', `Failed to load plugin: ${msg}`);
      return PluginResults.fail('LOAD_FAILED', msg);
    }
  }

  /**
   * Validate: confirms manifest integrity and readiness for activation.
   */
  public async validate(pluginId: string): Promise<PluginResult<boolean>> {
    try {
      const meta = this.registry.get(pluginId);
      if (!meta) {
        return PluginResults.fail('PLUGIN_NOT_FOUND', `Plugin "${pluginId}" not found`);
      }

      if (meta.lifecycleState !== 'registered' && meta.lifecycleState !== 'disabled') {
        return PluginResults.fail(
          'INVALID_STATE_TRANSITION',
          `Cannot validate plugin in state "${meta.lifecycleState}"`
        );
      }

      this.registry.updateState(pluginId, 'validated');
      return PluginResults.ok(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return PluginResults.fail('VALIDATION_FAILED', msg);
    }
  }

  /**
   * Enable: activates the plugin, initializes context, grants declared permissions,
   * registers UI extensions, and invokes onActivate safely.
   */
  public async enable(pluginId: string): Promise<PluginResult<void>> {
    const meta = this.registry.get(pluginId);
    if (!meta) {
      return PluginResults.fail('PLUGIN_NOT_FOUND', `Plugin "${pluginId}" not found`);
    }

    if (meta.lifecycleState === 'enabled') {
      return PluginResults.ok(undefined);
    }

    // Auto-validate if currently registered
    if (meta.lifecycleState === 'registered') {
      const valResult = await this.validate(pluginId);
      if (valResult.success === false) {
        return PluginResults.fail('VALIDATION_FAILED', valResult.error.message);
      }
    }

    try {
      // 1. Grant declared permissions
      this.permissions.setPermissions(pluginId, meta.manifest.permissions);

      // 2. Initialize cleanup tracker
      this.cleanups.set(pluginId, []);

      // 3. Construct sandboxed PluginContext
      const context = this.createPluginContext(meta.manifest);

      // 4. Update state to enabled
      this.registry.updateState(pluginId, 'enabled');
      meta.stats.activations++;

      // 5. Invoke onActivate if instance exists
      const instance = this.registry.getInstance(pluginId);
      if (instance) {
        try {
          await instance.onActivate(context);
        } catch (err: unknown) {
          // Catch and isolate plugin activation failure
          const errorMsg = err instanceof Error ? err.message : String(err);
          logger.warn('PluginRuntime', `Plugin "${pluginId}" failed during onActivate (isolated): ${errorMsg}`);
          
          // Rollback and transition to failed
          await this.rollbackPluginActivation(pluginId);
          this.registry.updateState(pluginId, 'failed', errorMsg);
          return PluginResults.fail('ACTIVATION_ERROR', `Plugin crashed during onActivate: ${errorMsg}`);
        }
      }

      logger.info('PluginRuntime', `Successfully enabled plugin "${pluginId}"`);
      return PluginResults.ok(undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.registry.updateState(pluginId, 'failed', msg);
      return PluginResults.fail('ENABLE_FAILED', msg);
    }
  }

  /**
   * Disable: safely deactivates the plugin, removes UI extensions, runs cleanups.
   */
  public async disable(pluginId: string): Promise<PluginResult<void>> {
    const meta = this.registry.get(pluginId);
    if (!meta) {
      return PluginResults.fail('PLUGIN_NOT_FOUND', `Plugin "${pluginId}" not found`);
    }

    if (meta.lifecycleState !== 'enabled' && meta.lifecycleState !== 'failed') {
      return PluginResults.ok(undefined);
    }

    try {
      // 1. Call onDeactivate if instance exists
      const instance = this.registry.getInstance(pluginId);
      if (instance && typeof instance.onDeactivate === 'function') {
        try {
          await instance.onDeactivate();
        } catch (err: unknown) {
          logger.warn('PluginRuntime', `Error during onDeactivate for ${pluginId}: ${String(err)}`);
        }
      }

      // 2. Execute registered cleanups
      await this.runPluginCleanups(pluginId);

      // 3. Remove UI extensions
      this.uiRegistry.unregisterPluginExtensions(pluginId);

      // 4. Update state
      this.registry.updateState(pluginId, 'disabled');
      logger.info('PluginRuntime', `Disabled plugin "${pluginId}"`);

      return PluginResults.ok(undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return PluginResults.fail('DISABLE_FAILED', msg);
    }
  }

  /**
   * Unload / Uninstall: disables, revokes permissions, removes from registry.
   */
  public async unload(pluginId: string): Promise<PluginResult<void>> {
    const meta = this.registry.get(pluginId);
    if (!meta) {
      return PluginResults.fail('PLUGIN_NOT_FOUND', `Plugin "${pluginId}" not found`);
    }

    // Disable first if enabled
    if (meta.lifecycleState === 'enabled') {
      await this.disable(pluginId);
    }

    // Revoke permissions
    this.permissions.clear(pluginId);

    // Remove UI extensions
    this.uiRegistry.unregisterPluginExtensions(pluginId);

    // Delete from registry
    this.registry.delete(pluginId);
    logger.info('PluginRuntime', `Unloaded and removed plugin "${pluginId}"`);

    return PluginResults.ok(undefined);
  }

  /**
   * Safe execution wrapper for external plugin invocations.
   * Prevents unhandled exceptions from propagating to the host application.
   */
  public async executePluginSafe<T>(
    pluginId: string,
    action: () => Promise<T> | T
  ): Promise<PluginResult<T>> {
    const meta = this.registry.get(pluginId);
    if (!meta || meta.lifecycleState !== 'enabled') {
      return PluginResults.fail(
        'PLUGIN_NOT_AVAILABLE',
        `Plugin "${pluginId}" is not in enabled state`
      );
    }

    meta.stats.invocations++;
    try {
      const res = await action();
      return PluginResults.ok(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      meta.stats.errors++;
      logger.warn('PluginRuntime', `Plugin execution error in ${pluginId} (isolated): ${msg}`);
      return PluginResults.fail('EXECUTION_ERROR', msg);
    }
  }

  // ============================================================
  // Internal Helpers
  // ============================================================

  private createPluginContext(manifest: PluginManifest): PluginContext {
    const pluginId = manifest.id;
    const storage = this.storageManager.getStorage(pluginId);
    const capabilities = this.broker.createCapabilityAccess(pluginId);

    const ui: PluginUIContext = {
      registerMenuItem: (item) => {
        this.uiRegistry.registerMenuItem({ ...item, pluginId });
      },
      registerPanel: (panel) => {
        this.uiRegistry.registerPanel({ ...panel, pluginId });
      },
      registerWidget: (widget) => {
        this.uiRegistry.registerWidget({ ...widget, pluginId });
      },
    };

    const formatMeta = (args: unknown[]): Record<string, unknown> | undefined => {
      if (args.length === 0) return undefined;
      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        return args[0] as Record<string, unknown>;
      }
      return { args };
    };

    const pluginLogger: IPluginLogger = {
      debug: (msg, ...args) => logger.debug(`Plugin:${pluginId}`, msg, formatMeta(args)),
      info: (msg, ...args) => logger.info(`Plugin:${pluginId}`, msg, formatMeta(args)),
      warn: (msg, ...args) => logger.warn(`Plugin:${pluginId}`, msg, formatMeta(args)),
      error: (msg, ...args) => logger.error(`Plugin:${pluginId}`, msg, formatMeta(args)),
    };

    return {
      pluginId,
      manifest,
      storage,
      ui,
      capabilities,
      logger: pluginLogger,
      addCleanup: (fn) => {
        if (!this.cleanups.has(pluginId)) {
          this.cleanups.set(pluginId, []);
        }
        this.cleanups.get(pluginId)!.push(fn);
      },
    };
  }

  private async runPluginCleanups(pluginId: string): Promise<void> {
    const fns = this.cleanups.get(pluginId);
    if (fns) {
      for (const fn of fns) {
        try {
          await fn();
        } catch (err) {
          logger.warn('PluginRuntime', `Cleanup function error in ${pluginId}: ${String(err)}`);
        }
      }
      this.cleanups.delete(pluginId);
    }
  }

  private async rollbackPluginActivation(pluginId: string): Promise<void> {
    await this.runPluginCleanups(pluginId);
    this.uiRegistry.unregisterPluginExtensions(pluginId);
    this.permissions.clear(pluginId);
  }
}
