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
    // Always log to console in development
    const consoleMethod = level === 'debug' ? 'log' : level;
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '');

    // Send to Sentry using experimental logs API
    if (Sentry.logger && typeof Sentry.logger[level] === 'function') {
      Sentry.logger[level](message, data);
    } else {
      // Fallback: Add as breadcrumb if logger not available
      Sentry.addBreadcrumb({
        category: 'log',
        message,
        level: level === 'debug' ? 'debug' : level === 'info' ? 'info' : level === 'warn' ? 'warning' : 'error',
        data,
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
 * Sentry Metrics - Track custom metrics
 * Usage:
 *   import { metrics } from '@/utils/sentryLogger';
 *   metrics.increment('courses.viewed');
 *   metrics.gauge('filter.active_count', 5);
 *   metrics.timing('api.response_time', 150);
 */
export const metrics = {
  /**
   * Increment a counter metric
   */
  increment: (name: string, value: number = 1, tags?: Record<string, string>) => {
    Sentry.metrics.increment(name, value, { tags });
  },

  /**
   * Set a gauge metric (current value)
   */
  gauge: (name: string, value: number, tags?: Record<string, string>) => {
    Sentry.metrics.gauge(name, value, { tags });
  },

  /**
   * Record a timing/distribution metric
   */
  timing: (name: string, value: number, tags?: Record<string, string>) => {
    Sentry.metrics.distribution(name, value, { tags, unit: 'millisecond' });
  },

  /**
   * Record a set metric (unique values)
   */
  set: (name: string, value: string | number, tags?: Record<string, string>) => {
    Sentry.metrics.set(name, value, { tags });
  },
};

export default { logger, metrics };
