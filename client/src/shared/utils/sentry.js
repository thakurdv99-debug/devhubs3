/**
 * Sentry configuration for frontend
 * Only initializes if DSN is provided
 */

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'production';
  
  if (!dsn) {
    // Sentry is optional - don't initialize if DSN is not provided
    return null;
  }

  try {
    // Dynamic import to avoid bundling Sentry in development if not needed
    import('@sentry/react').then((SentryModule) => {
      const Sentry = SentryModule.default || SentryModule;
      Sentry.init({
        dsn,
        environment,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        // Session Replay
        replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,
        // Filter out sensitive data
        beforeSend(event, hint) {
          // Remove sensitive data from events
          if (event.request) {
            delete event.request.cookies;
            if (event.request.headers) {
              delete event.request.headers['Authorization'];
            }
          }
          return event;
        },
      });
    });
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

