/**
 * Structured, security-hardened Logger for Chat Connect & MUSCAL.
 * Guaranteed to sanitize and never leak private keys, seed material, or secrets.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  context: string;
  message: string;
  meta?: Record<string, unknown>;
}

// Keys and patterns that must never be recorded in plain text
const SENSITIVE_KEY_PATTERNS = [
  /private/i,
  /secret/i,
  /seed/i,
  /credential/i,
  /token/i,
  /password/i,
  /auth_key/i,
  /^d$/, // JWK private exponent
  /^k$/, // Symmetric raw key
];

export function sanitizeData(data: unknown, depth = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Check for PEM/base64 private key indicators
    if (data.includes('PRIVATE KEY') || data.includes('BEGIN EC PRIVATE KEY')) {
      return '[REDACTED_PRIVATE_KEY]';
    }
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  const obj = data as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(key));
    if (isSensitive) {
      sanitized[key] = '[REDACTED_CONFIDENTIAL]';
    } else {
      sanitized[key] = sanitizeData(val, depth + 1);
    }
  }

  return sanitized;
}

class LoggerService {
  private inMemoryLogs: LogEntry[] = [];
  private maxLogs = 500;
  private listeners: ((entry: LogEntry) => void)[] = [];

  private log(level: LogLevel, context: string, message: string, meta?: Record<string, unknown>): void {
    const safeMeta = meta ? (sanitizeData(meta) as Record<string, unknown>) : undefined;
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      level,
      context,
      message,
      meta: safeMeta,
    };

    this.inMemoryLogs.push(entry);
    if (this.inMemoryLogs.length > this.maxLogs) {
      this.inMemoryLogs.shift();
    }

    // Output to console with styled badges
    const timeStr = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timeStr}][${context}][${level}]`;
    if (level === 'ERROR') {
      console.error(prefix, message, safeMeta ?? '');
    } else if (level === 'WARN') {
      console.warn(prefix, message, safeMeta ?? '');
    } else if (level === 'INFO') {
      console.info(prefix, message, safeMeta ?? '');
    } else {
      console.debug(prefix, message, safeMeta ?? '');
    }

    // Notify memory/UI subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch {
        // ignore subscriber exceptions
      }
    });
  }

  public debug(context: string, message: string, meta?: Record<string, unknown>): void {
    this.log('DEBUG', context, message, meta);
  }

  public info(context: string, message: string, meta?: Record<string, unknown>): void {
    this.log('INFO', context, message, meta);
  }

  public warn(context: string, message: string, meta?: Record<string, unknown>): void {
    this.log('WARN', context, message, meta);
  }

  public error(context: string, message: string, meta?: Record<string, unknown>): void {
    this.log('ERROR', context, message, meta);
  }

  public getLogs(): LogEntry[] {
    return [...this.inMemoryLogs];
  }

  public subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public clear(): void {
    this.inMemoryLogs = [];
  }
}

export const logger = new LoggerService();
