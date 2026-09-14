/**
 * Permission Manager.
 * 
 * Manages granted permissions per plugin ID.
 * Decoupled from Capabilities:
 * - Permission determines authority ("WAS darf das Plugin?")
 * - CapabilityBroker determines accessible API surfaces ("WELCHE Schnittstellen stehen bereit?")
 */

import {
  PluginPermission,
  isPluginPermission,
  isForbiddenPermission,
} from '../api/PluginPermission';
import { logger } from '@/core/logging/Logger';
import { eventBus } from '@/core/events/EventBus';

export class PermissionManagerError extends Error {
  constructor(message: string, public readonly code: string = 'PERMISSION_ERROR') {
    super(message);
    this.name = 'PermissionManagerError';
  }
}

export class PermissionManager {
  private static instance: PermissionManager | null = null;

  // pluginId -> Set of granted permissions
  private granted = new Map<string, Set<PluginPermission>>();

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  public grantPermission(pluginId: string, permission: PluginPermission): void {
    if (!pluginId || typeof pluginId !== 'string') {
      throw new PermissionManagerError('Invalid pluginId');
    }

    if (isForbiddenPermission(permission)) {
      logger.warn('PermissionManager', `Blocked attempt to grant strictly forbidden permission "${permission}" to ${pluginId}`);
      throw new PermissionManagerError(
        `Permission "${permission}" is strictly forbidden and can never be granted`,
        'FORBIDDEN_PERMISSION_REQUEST'
      );
    }

    if (!isPluginPermission(permission)) {
      throw new PermissionManagerError(`Unknown permission "${permission}"`, 'UNKNOWN_PERMISSION');
    }

    if (!this.granted.has(pluginId)) {
      this.granted.set(pluginId, new Set());
    }

    this.granted.get(pluginId)!.add(permission);
    logger.debug('PermissionManager', `Granted permission "${permission}" to plugin ${pluginId}`);
    eventBus.emit('plugin:permission_granted', { pluginId, permission });
  }

  public revokePermission(pluginId: string, permission: PluginPermission): void {
    const set = this.granted.get(pluginId);
    if (set && set.delete(permission)) {
      logger.debug('PermissionManager', `Revoked permission "${permission}" from plugin ${pluginId}`);
      eventBus.emit('plugin:permission_revoked', { pluginId, permission });
    }
  }

  public hasPermission(pluginId: string, permission: PluginPermission): boolean {
    if (isForbiddenPermission(permission)) {
      return false; // Forbidden permissions are never granted
    }
    const set = this.granted.get(pluginId);
    return set ? set.has(permission) : false;
  }

  public getGrantedPermissions(pluginId: string): Set<PluginPermission> {
    const set = this.granted.get(pluginId);
    return set ? new Set(set) : new Set();
  }

  public setPermissions(pluginId: string, permissions: PluginPermission[]): void {
    const validSet = new Set<PluginPermission>();
    for (const p of permissions) {
      if (isForbiddenPermission(p)) {
        throw new PermissionManagerError(
          `Cannot assign forbidden permission "${p}" to ${pluginId}`,
          'FORBIDDEN_PERMISSION_REQUEST'
        );
      }
      if (isPluginPermission(p)) {
        validSet.add(p);
      }
    }
    this.granted.set(pluginId, validSet);
    logger.debug('PermissionManager', `Configured ${validSet.size} permissions for ${pluginId}`);
  }

  public clear(pluginId?: string): void {
    if (pluginId) {
      this.granted.delete(pluginId);
    } else {
      this.granted.clear();
    }
  }
}
