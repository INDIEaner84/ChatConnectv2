/**
 * Plugin Widget contract for compact dashboard or chat widgets.
 */

import React from 'react';

export type PluginWidgetSize = 'compact' | 'standard' | 'full';

export interface PluginWidget {
  readonly id: string;
  readonly pluginId: string;
  readonly title: string;
  readonly size: PluginWidgetSize;
  readonly render: () => React.ReactNode;
}
