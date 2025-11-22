/**
 * Logger utility for frontend
 * Automatically filters out logs in production builds
 */

const isDevelopment = () => import.meta.env.MODE === 'development';
const isProduction = () => import.meta.env.MODE === 'production';

export const logger = {
  /**
   * Log info messages (only in development)
   */
  info: (...args) => {
    if (isDevelopment()) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args) => {
    if (isDevelopment()) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log errors (always logs, but formatted)
   */
  error: (...args) => {
    if (isProduction()) {
      // In production, only log critical errors without sensitive data
      console.error('[ERROR]', args[0]);
    } else {
      console.error('[ERROR]', ...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDevelopment()) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log payment events (only in development)
   */
  payment: (...args) => {
    if (isDevelopment()) {
      console.log('[PAYMENT]', ...args);
    }
  }
};

export default logger;

