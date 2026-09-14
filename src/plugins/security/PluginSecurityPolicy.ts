/**
 * Plugin Security Policy specifications and constraints.
 */

export interface PluginSecurityPolicyConfig {
  allowHttp: boolean; // default false, https only
  maxStorageQuotaBytes: number; // default 10MB
  networkTimeoutMs: number; // default 15000ms
  maxInferenceTokens: number; // default 2048
  rateLimitPerMinute: number; // default 60 operations/min
}

export const DEFAULT_SECURITY_POLICY: PluginSecurityPolicyConfig = {
  allowHttp: false,
  maxStorageQuotaBytes: 10 * 1024 * 1024,
  networkTimeoutMs: 15_000,
  maxInferenceTokens: 2048,
  rateLimitPerMinute: 60,
};

export class PluginSecurityException extends Error {
  constructor(message: string, public readonly code: string = 'SECURITY_POLICY_VIOLATION') {
    super(message);
    this.name = 'PluginSecurityException';
  }
}

export class PluginSecurityPolicy {
  public static validateOutboundUrl(urlStr: string, allowHttp = false): URL {
    if (!urlStr || typeof urlStr !== 'string') {
      throw new PluginSecurityException('Outbound URL must be a non-empty string', 'INVALID_URL');
    }

    let parsed: URL;
    try {
      parsed = new URL(urlStr);
    } catch {
      throw new PluginSecurityException(`Malformed outbound URL: "${urlStr}"`, 'INVALID_URL');
    }

    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'https:' || protocol === 'wss:') {
      return parsed;
    }

    if (allowHttp && protocol === 'http:') {
      return parsed;
    }

    throw new PluginSecurityException(
      `Protocol "${protocol}" is forbidden by security policy. Only https: and wss: are allowed.`,
      'FORBIDDEN_PROTOCOL'
    );
  }

  public static sanitizeAuditLogPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const REDACTED_KEYS = ['privatekey', 'secret', 'token', 'seed', 'password', 'auth', 'cookie'];

    for (const [key, val] of Object.entries(payload)) {
      const lowerKey = key.toLowerCase();
      if (REDACTED_KEYS.some((k) => lowerKey.includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = Array.isArray(val) ? '[Array]' : '[Object]';
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }
}
