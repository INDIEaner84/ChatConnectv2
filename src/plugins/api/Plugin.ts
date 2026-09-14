/**
 * Plugin Contract interface.
 * 
 * Plugins implement this interface to be managed by the PluginRuntime.
 */

import { PluginManifest } from './PluginManifest';
import { PluginContext } from './PluginContext';

export interface IPlugin {
  readonly manifest: PluginManifest;
  onActivate(context: PluginContext): Promise<void> | void;
  onDeactivate?(): Promise<void> | void;
}
