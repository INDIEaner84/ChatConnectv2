/**
 * Plugin Menu Item contract for UI navigation extension points.
 */

export interface PluginMenuItem {
  readonly id: string;
  readonly pluginId: string;
  readonly label: string;
  readonly icon?: string; // Lucide icon identifier or SVG string
  readonly section: 'navigation' | 'conversation' | 'tools';
  readonly order?: number;
  readonly badge?: string;
  readonly onClick?: () => void;
}
