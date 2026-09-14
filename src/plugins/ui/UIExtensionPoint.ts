/**
 * UI Extension Point registry and contracts.
 * 
 * Controls UI extension points so community plugins cannot manipulate the raw DOM
 * or internal React tree directly.
 */

import { PluginMenuItem } from './PluginMenuItem';
import { PluginPanel } from './PluginPanel';
import { PluginWidget } from './PluginWidget';
import { logger } from '@/core/logging/Logger';

export type UIExtensionType = 'menu' | 'panel' | 'widget';

export interface UIRegistrationSummary {
  menus: number;
  panels: number;
  widgets: number;
}

export class UIExtensionRegistry {
  private static instance: UIExtensionRegistry | null = null;

  private menuItems = new Map<string, PluginMenuItem>();
  private panels = new Map<string, PluginPanel>();
  private widgets = new Map<string, PluginWidget>();

  // pluginId -> set of registered IDs
  private pluginEntities = new Map<string, Set<string>>();

  public static getInstance(): UIExtensionRegistry {
    if (!UIExtensionRegistry.instance) {
      UIExtensionRegistry.instance = new UIExtensionRegistry();
    }
    return UIExtensionRegistry.instance;
  }

  // --- Menu Items ---
  public registerMenuItem(item: PluginMenuItem): void {
    this.validateId(item.id, item.pluginId);
    this.menuItems.set(item.id, item);
    this.trackPluginEntity(item.pluginId, item.id);
    logger.debug('UIExtensionRegistry', `Registered menu item "${item.id}" for plugin ${item.pluginId}`);
  }

  public getMenuItems(section?: PluginMenuItem['section']): PluginMenuItem[] {
    const all = Array.from(this.menuItems.values());
    if (!section) return all;
    return all.filter((m) => m.section === section).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }

  // --- Panels ---
  public registerPanel(panel: PluginPanel): void {
    this.validateId(panel.id, panel.pluginId);
    this.panels.set(panel.id, panel);
    this.trackPluginEntity(panel.pluginId, panel.id);
    logger.debug('UIExtensionRegistry', `Registered panel "${panel.id}" for plugin ${panel.pluginId}`);
  }

  public getPanels(placement?: PluginPanel['placement']): PluginPanel[] {
    const all = Array.from(this.panels.values());
    if (!placement) return all;
    return all.filter((p) => p.placement === placement);
  }

  // --- Widgets ---
  public registerWidget(widget: PluginWidget): void {
    this.validateId(widget.id, widget.pluginId);
    this.widgets.set(widget.id, widget);
    this.trackPluginEntity(widget.pluginId, widget.id);
    logger.debug('UIExtensionRegistry', `Registered widget "${widget.id}" for plugin ${widget.pluginId}`);
  }

  public getWidgets(): PluginWidget[] {
    return Array.from(this.widgets.values());
  }

  // --- Cleanup on Plugin Unload/Disable ---
  public unregisterPluginExtensions(pluginId: string): UIRegistrationSummary {
    const entityIds = this.pluginEntities.get(pluginId);
    let removedMenus = 0;
    let removedPanels = 0;
    let removedWidgets = 0;

    if (entityIds) {
      for (const id of entityIds) {
        if (this.menuItems.delete(id)) removedMenus++;
        if (this.panels.delete(id)) removedPanels++;
        if (this.widgets.delete(id)) removedWidgets++;
      }
      this.pluginEntities.delete(pluginId);
    }

    logger.debug(
      'UIExtensionRegistry',
      `Unregistered UI extensions for ${pluginId} (menus: ${removedMenus}, panels: ${removedPanels}, widgets: ${removedWidgets})`
    );

    return {
      menus: removedMenus,
      panels: removedPanels,
      widgets: removedWidgets,
    };
  }

  public clearAll(): void {
    this.menuItems.clear();
    this.panels.clear();
    this.widgets.clear();
    this.pluginEntities.clear();
  }

  private validateId(id: string, pluginId: string): void {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('UI Extension must have a valid non-empty id');
    }
    if (!pluginId || typeof pluginId !== 'string' || pluginId.trim() === '') {
      throw new Error('UI Extension must be associated with a valid pluginId');
    }
  }

  private trackPluginEntity(pluginId: string, entityId: string): void {
    if (!this.pluginEntities.has(pluginId)) {
      this.pluginEntities.set(pluginId, new Set());
    }
    this.pluginEntities.get(pluginId)!.add(entityId);
  }
}
