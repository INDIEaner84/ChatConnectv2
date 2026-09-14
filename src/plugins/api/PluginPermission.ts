/**
 * Plugin Permission model.
 * 
 * Defines what actions and resources a plugin is permitted to access.
 * Capabilities and permissions are decoupled:
 * - Permission: "What is the plugin allowed to do?" (declared in manifest & granted by user/policy)
 * - Capability: "What controlled API interface is exposed to the plugin?"
 */

export const PLUGIN_PERMISSIONS = [
  'ui:panel',
  'ui:menu',
  'ui:widget',
  'messaging:read',
  'messaging:send',
  'contacts:read',
  'storage:plugin',
  'network:request',
  'ai:inference',
  'ai:context',
  'ai:tool',
  'location:approximate',
  'filesystem:user-selected',
] as const;

export type PluginPermission = (typeof PLUGIN_PERMISSIONS)[number];

export type PermissionSecurityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PermissionDefinition {
  permission: PluginPermission;
  label: string;
  description: string;
  securityLevel: PermissionSecurityLevel;
}

export const PERMISSION_DEFINITIONS: Record<PluginPermission, PermissionDefinition> = {
  'ui:panel': {
    permission: 'ui:panel',
    label: 'UI Panels',
    description: 'Render dedicated panels in the main layout or drawers',
    securityLevel: 'low',
  },
  'ui:menu': {
    permission: 'ui:menu',
    label: 'UI Menu Items',
    description: 'Add menu entries to sidebars and context actions',
    securityLevel: 'low',
  },
  'ui:widget': {
    permission: 'ui:widget',
    label: 'UI Widgets',
    description: 'Render compact dashboard or conversation widgets',
    securityLevel: 'low',
  },
  'storage:plugin': {
    permission: 'storage:plugin',
    label: 'Isolated Storage',
    description: 'Store and retrieve private key-value data in an isolated plugin namespace',
    securityLevel: 'low',
  },
  'messaging:read': {
    permission: 'messaging:read',
    label: 'Read Conversations (Sanitized)',
    description: 'Read sanitized public conversation summaries without private keys',
    securityLevel: 'high',
  },
  'messaging:send': {
    permission: 'messaging:send',
    label: 'Send Messages',
    description: 'Send messages via the controlled message outbox',
    securityLevel: 'medium',
  },
  'contacts:read': {
    permission: 'contacts:read',
    label: 'Read Verified Contacts',
    description: 'Read verified peer contact public identities and display names',
    securityLevel: 'medium',
  },
  'network:request': {
    permission: 'network:request',
    label: 'Outbound Network Access',
    description: 'Make HTTPS or WSS network requests to declared external endpoints',
    securityLevel: 'high',
  },
  'ai:inference': {
    permission: 'ai:inference',
    label: 'AI Inferences',
    description: 'Request on-device or hybrid AI model completions via broker',
    securityLevel: 'medium',
  },
  'ai:context': {
    permission: 'ai:context',
    label: 'Context Provider',
    description: 'Provide contextual memory snippets to conversations',
    securityLevel: 'medium',
  },
  'ai:tool': {
    permission: 'ai:tool',
    label: 'Tool Function Calling',
    description: 'Register callable tool functions accessible to assistant agents',
    securityLevel: 'medium',
  },
  'location:approximate': {
    permission: 'location:approximate',
    label: 'Approximate Location',
    description: 'Access low-resolution approximate geographic area (no precise GPS)',
    securityLevel: 'medium',
  },
  'filesystem:user-selected': {
    permission: 'filesystem:user-selected',
    label: 'User-Selected Files',
    description: 'Read files explicitly selected by the user via file picker',
    securityLevel: 'medium',
  },
};

/**
 * Forbidden permissions that NO plugin may ever request or receive.
 * Requesting any of these causes immediate rejection of the plugin manifest.
 */
export const FORBIDDEN_PERMISSIONS = [
  'identity:private',
  'keys:private',
  'storage:core',
  'eval:execute',
  'dom:raw',
  'system:root',
  'webrtc:raw-sockets',
] as const;

export type ForbiddenPermission = (typeof FORBIDDEN_PERMISSIONS)[number];

export function isPluginPermission(val: string): val is PluginPermission {
  return (PLUGIN_PERMISSIONS as readonly string[]).includes(val);
}

export function isForbiddenPermission(val: string): val is ForbiddenPermission {
  return (FORBIDDEN_PERMISSIONS as readonly string[]).includes(val);
}
