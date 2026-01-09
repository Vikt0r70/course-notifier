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
 * Sentry Metrics - Track custom metrics
 * Note: Metrics API is available in Sentry SDK 10.x+
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
    try {
      Sentry.metrics.increment(name, value, { tags });
    } catch {
      // Metrics API may not be available
      console.debug(`[Metrics] ${name}: +${value}`, tags);
    }
  },

  /**
   * Set a gauge metric (current value)
   */
  gauge: (name: string, value: number, tags?: Record<string, string>) => {
    try {
      Sentry.metrics.gauge(name, value, { tags });
    } catch {
      console.debug(`[Metrics] ${name}: ${value}`, tags);
    }
  },

  /**
   * Record a timing/distribution metric
   */
  timing: (name: string, value: number, unit: string = 'millisecond', tags?: Record<string, string>) => {
    try {
      Sentry.metrics.distribution(name, value, { tags, unit });
    } catch {
      console.debug(`[Metrics] ${name}: ${value}${unit}`, tags);
    }
  },

  /**
   * Record a set metric (unique values)
   */
  set: (name: string, value: string | number, tags?: Record<string, string>) => {
    try {
      Sentry.metrics.set(name, value, { tags });
    } catch {
      console.debug(`[Metrics] ${name}: ${value}`, tags);
    }
  },
};

export default { logger, metrics };
