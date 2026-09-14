/**
 * Standard PluginResult envelope for plugin lifecycle and invocation.
 */

export interface PluginErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export type PluginResult<T> =
  | { success: true; data: T; timestamp: number }
  | { success: false; error: PluginErrorDetails; timestamp: number };

export const PluginResults = {
  ok<T>(data: T): PluginResult<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
    };
  },

  fail<T = unknown>(code: string, message: string, details?: Record<string, unknown>, stack?: string): PluginResult<T> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        stack,
      },
      timestamp: Date.now(),
    };
  },
};
