/**
 * Plugin API versioning and compatibility checks.
 */

export const CURRENT_PLUGIN_API_VERSION = '1';
export const SUPPORTED_PLUGIN_API_VERSIONS = ['1', '1.0'] as const;

export function isApiVersionCompatible(version: string): boolean {
  if (!version || typeof version !== 'string') return false;
  const trimmed = version.trim();
  return (SUPPORTED_PLUGIN_API_VERSIONS as readonly string[]).includes(trimmed);
}

/**
 * Validates a standard SemVer string (e.g., '1.0.0', '0.2.1-beta').
 */
export function isSemVerValid(version: string): boolean {
  if (!version || typeof version !== 'string') return false;
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version.trim());
}
