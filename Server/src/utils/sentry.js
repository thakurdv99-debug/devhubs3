/**
 * Sentry configuration for backend
 * Only initializes if DSN is provided
 */

let SentryInstance = null;

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production';
  
  if (!dsn) {
    // Sentry is optional - don't initialize if DSN is not provided
    return null;
  }

  // Initialize Sentry asynchronously
  import('@sentry/node').then((SentryModule) => {
    const Sentry = SentryModule.default || SentryModule;
    SentryInstance = Sentry;
    
    Sentry.init({
      dsn,
      environment,
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from events
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['Authorization'];
          }
        }
        return event;
      },
    });
  }).catch((error) => {
    console.error('Failed to initialize Sentry:', error);
  });
  
  // Return a proxy object that will work once Sentry is loaded
  return {
    get Handlers() {
      return SentryInstance ? SentryInstance.Handlers : {
        requestHandler: () => (req, res, next) => next(),
        tracingHandler: () => (req, res, next) => next(),
        errorHandler: () => (err, req, res, next) => next(err)
      };
    }
  };
};
