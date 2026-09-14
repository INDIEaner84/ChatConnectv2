/**
 * Plugin Context provided to active plugins.
 * 
 * Strict barrier:
 * PLUGIN CODE ≠ CORE CODE
 * 
 * Plugins interact ONLY through this context, which proxies all operations
 * through the CapabilityBroker and PermissionManager.
 */

import { PluginManifest } from './PluginManifest';
import { IPluginStorage } from '../storage/PluginStorage';
import { ICapabilityAccess } from './PluginCapability';
import { PluginMenuItem } from '../ui/PluginMenuItem';
import { PluginPanel } from '../ui/PluginPanel';
import { PluginWidget } from '../ui/PluginWidget';

export interface IPluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface PluginUIContext {
  registerMenuItem(item: Omit<PluginMenuItem, 'pluginId'>): void;
  registerPanel(panel: Omit<PluginPanel, 'pluginId'>): void;
  registerWidget(widget: Omit<PluginWidget, 'pluginId'>): void;
}

export interface PluginContext {
  readonly pluginId: string;
  readonly manifest: Readonly<PluginManifest>;
  readonly storage: IPluginStorage;
  readonly ui: PluginUIContext;
  readonly capabilities: ICapabilityAccess;
  readonly logger: IPluginLogger;
  addCleanup(fn: () => void | Promise<void>): void;
}
