/**
 * Plugin Panel contract for UI layout extension points.
 */

import React from 'react';

export type PluginPanelPlacement = 'main' | 'drawer' | 'sidebar-bottom';

export interface PluginPanel {
  readonly id: string;
  readonly pluginId: string;
  readonly title: string;
  readonly placement: PluginPanelPlacement;
  readonly icon?: string;
  readonly render: () => React.ReactNode;
}
