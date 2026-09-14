/**
 * Domain error classes for Chat Connect and MUSCAL Runtime.
 */

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code = 'APP_ERROR', severity: ErrorSeverity = 'error', details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.timestamp = Date.now();
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StorageError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'STORAGE_ERROR', 'error', details);
    this.name = 'StorageError';
  }
}

export class IdentityError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'IDENTITY_ERROR', 'error', details);
    this.name = 'IdentityError';
  }
}

export class SecurityError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SECURITY_ERROR', 'fatal', details);
    this.name = 'SecurityError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 'warning', details);
    this.name = 'ValidationError';
  }
}

export class SyncError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SYNC_ERROR', 'error', details);
    this.name = 'SyncError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 'warning', details);
    this.name = 'NetworkError';
  }
}
