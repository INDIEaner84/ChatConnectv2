/**
 * Plugin Manifest specification and strict validation.
 */

import {
  PluginPermission,
  isPluginPermission,
  isForbiddenPermission,
  FORBIDDEN_PERMISSIONS,
} from './PluginPermission';
import {
  PluginCapabilityKey,
  isPluginCapabilityKey,
  CAPABILITY_REQUIRED_PERMISSIONS,
} from './PluginCapability';
import { isApiVersionCompatible, isSemVerValid } from './PluginVersion';

export interface PluginEntrypoints {
  main?: string;
  ui?: string;
  worker?: string;
}

export interface PluginManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly apiVersion: string;
  readonly publisher: string;
  readonly description: string;
  readonly entrypoints?: PluginEntrypoints;
  readonly permissions: PluginPermission[];
  readonly capabilities: PluginCapabilityKey[];
  readonly metadata?: Record<string, unknown>;
}

export interface ManifestValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly sanitizedManifest?: PluginManifest;
}

// Allowed ID pattern: <scope>.<publisher>.<name> (alphanumeric, dash, underscore)
const PLUGIN_ID_REGEX = /^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/;

// Forbidden namespace prefixes for plugin IDs to prevent impersonation of internal core
export const RESERVED_ID_PREFIXES = ['core.', 'internal.', 'muscal.core.', 'sys.', 'system.'];

export function validatePluginManifest(manifest: unknown): ManifestValidationResult {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { valid: false, errors: ['Manifest must be a non-null JSON object'] };
  }

  const m = manifest as Record<string, unknown>;

  // 1. Validate ID
  if (typeof m.id !== 'string' || !m.id.trim()) {
    errors.push('Manifest "id" is required and must be a string');
  } else {
    const id = m.id.trim();
    if (!PLUGIN_ID_REGEX.test(id)) {
      errors.push(`Manifest "id" "${id}" is invalid: must match pattern "<scope>.<publisher>.<name>" (lowercase, numbers, dashes, underscores, separated by dots)`);
    }
    for (const prefix of RESERVED_ID_PREFIXES) {
      if (id.startsWith(prefix)) {
        errors.push(`Manifest "id" cannot start with reserved prefix "${prefix}"`);
      }
    }
  }

  // 2. Validate Name
  if (typeof m.name !== 'string' || !m.name.trim()) {
    errors.push('Manifest "name" is required');
  } else if (m.name.trim().length > 64) {
    errors.push('Manifest "name" cannot exceed 64 characters');
  }

  // 3. Validate Publisher
  if (typeof m.publisher !== 'string' || !m.publisher.trim()) {
    errors.push('Manifest "publisher" is required');
  } else if (m.publisher.trim().length > 64) {
    errors.push('Manifest "publisher" cannot exceed 64 characters');
  }

  // 4. Validate Version
  if (typeof m.version !== 'string' || !m.version.trim()) {
    errors.push('Manifest "version" is required');
  } else if (!isSemVerValid(m.version)) {
    errors.push(`Manifest "version" "${m.version}" is not a valid Semantic Version (e.g. "1.0.0")`);
  }

  // 5. Validate apiVersion
  if (typeof m.apiVersion !== 'string' && typeof m.apiVersion !== 'number') {
    errors.push('Manifest "apiVersion" is required');
  } else {
    const apiVerStr = String(m.apiVersion).trim();
    if (!isApiVersionCompatible(apiVerStr)) {
      errors.push(`Incompatible "apiVersion" "${apiVerStr}". Supported versions: ["1", "1.0"]`);
    }
  }

  // 6. Validate Description
  if (typeof m.description !== 'string') {
    errors.push('Manifest "description" must be a string');
  } else if (m.description.length > 500) {
    errors.push('Manifest "description" cannot exceed 500 characters');
  }

  // 7. Validate Permissions
  const permissions: PluginPermission[] = [];
  if (!Array.isArray(m.permissions)) {
    errors.push('Manifest "permissions" must be an array');
  } else {
    for (const perm of m.permissions) {
      if (typeof perm !== 'string') {
        errors.push(`Invalid permission element: ${String(perm)}`);
        continue;
      }
      if (isForbiddenPermission(perm)) {
        errors.push(`Manifest requests strictly FORBIDDEN permission "${perm}". Registration blocked.`);
        continue;
      }
      if (!isPluginPermission(perm)) {
        errors.push(`Unknown permission requested: "${perm}"`);
        continue;
      }
      if (!permissions.includes(perm)) {
        permissions.push(perm);
      }
    }
  }

  // 8. Validate Capabilities
  const capabilities: PluginCapabilityKey[] = [];
  if (!Array.isArray(m.capabilities)) {
    errors.push('Manifest "capabilities" must be an array');
  } else {
    for (const cap of m.capabilities) {
      if (typeof cap !== 'string' || !isPluginCapabilityKey(cap)) {
        errors.push(`Unknown capability requested: "${String(cap)}"`);
        continue;
      }
      if (!capabilities.includes(cap)) {
        capabilities.push(cap);
      }
    }
  }

  // 9. Consistency Check: Declared capabilities must have required permissions
  for (const cap of capabilities) {
    const required = CAPABILITY_REQUIRED_PERMISSIONS[cap] || [];
    for (const reqPerm of required) {
      if (!permissions.includes(reqPerm)) {
        errors.push(`Capability "${cap}" requires permission "${reqPerm}", but it was not declared in "permissions" array`);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitized: PluginManifest = {
    id: (m.id as string).trim(),
    name: (m.name as string).trim(),
    version: (m.version as string).trim(),
    apiVersion: String(m.apiVersion).trim(),
    publisher: (m.publisher as string).trim(),
    description: (m.description as string).trim(),
    entrypoints: m.entrypoints as PluginEntrypoints | undefined,
    permissions,
    capabilities,
    metadata: m.metadata as Record<string, unknown> | undefined,
  };

  return {
    valid: true,
    errors: [],
    sanitizedManifest: sanitized,
  };
}
