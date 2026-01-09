import * as Sentry from '@sentry/react';

/**
 * Sentry Logger - Send logs to Sentry for debugging
 * Usage:
 *   import { logger } from '@/utils/sentryLogger';
 *   logger.info('User logged in', { userId: 123 });
 *   logger.error('Failed to fetch courses', { error });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: unknown;
}

const createLogger = () => {
  const log = (level: LogLevel, message: string, data?: LogData) => {
    // Always log to console
    const consoleMethod = level === 'debug' ? 'log' : level;
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '');

    // Add as breadcrumb for Sentry context
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      level: level === 'debug' ? 'debug' : level === 'info' ? 'info' : level === 'warn' ? 'warning' : 'error',
      data,
    });

    // For errors, also capture as an event
    if (level === 'error') {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: data,
      });
    }
  };

  return {
    debug: (message: string, data?: LogData) => log('debug', message, data),
    info: (message: string, data?: LogData) => log('info', message, data),
    warn: (message: string, data?: LogData) => log('warn', message, data),
    error: (message: string, data?: LogData) => log('error', message, data),
  };
};

export const logger = createLogger();

/**
 * Sentry Metrics helper
 * Uses Sentry's built-in metrics when available
 */
export const metrics = {
  /**
   * Track a custom metric using Sentry spans
   */
  track: (name: string, value: number, unit?: string) => {
    Sentry.startSpan(
      {
        name: `metric.${name}`,
        op: 'metric',
        attributes: { value, unit: unit || 'count' },
      },
      () => {
        // Span will be recorded in Sentry traces
      }
    );
  },

  /**
   * Time an async operation
   */
  timeAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return Sentry.startSpan(
      { name, op: 'function' },
      async () => {
        return await fn();
      }
    );
  },

  /**
   * Time a sync operation
   */
  time: <T>(name: string, fn: () => T): T => {
    return Sentry.startSpan(
      { name, op: 'function' },
      () => {
        return fn();
      }
    );
  },
};

export default { logger, metrics };
