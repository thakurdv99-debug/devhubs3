const isDevelopment = () => process.env.NODE_ENV === 'development';
const isProduction = () => process.env.NODE_ENV === 'production';

export const logger = {
  info: (message, data = {}) => {
    if (isDevelopment() || !isProduction()) {
      console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data);
    }
  },
  
  error: (message, error = {}) => {
    // Always log errors, but sanitize in production
    if (isProduction()) {
      console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    } else {
      console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
    }
    
    // Send to Sentry if configured
    try {
      const Sentry = require('@sentry/node');
      if (Sentry && typeof Sentry.captureException === 'function') {
        if (error instanceof Error) {
          Sentry.captureException(error, {
            tags: { logger: true },
            extra: { message }
          });
        } else if (error && error.message) {
          Sentry.captureException(new Error(error.message), {
            tags: { logger: true },
            extra: { message, errorData: error }
          });
        } else {
          Sentry.captureMessage(message, {
            level: 'error',
            tags: { logger: true },
            extra: error
          });
        }
      }
    } catch (sentryError) {
      // Sentry might not be initialized, ignore
    }
  },
  
  warn: (message, data = {}) => {
    if (isDevelopment() || !isProduction()) {
      console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data);
    }
  },
  
  debug: (message, data = {}) => {
    if (isDevelopment()) {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data);
    }
  }
};

export const logPaymentEvent = (event, data) => {
  logger.info(`Payment Event: ${event}`, {
    timestamp: new Date().toISOString(),
    event,
    ...data
  });
};

export const logWebhookEvent = (provider, eventType, eventId, data = {}) => {
  logger.info(`Webhook Event: ${provider} - ${eventType}`, {
    eventId,
    provider,
    eventType,
    ...data
  });
};
