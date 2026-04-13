import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.15 : 1.0,

  beforeSend(event) {
    // Never forward full request bodies or auth tokens in server errors
    if (event.request?.data) {
      event.request.data = '[Filtered]';
    }
    if (event.request?.cookies) {
      event.request.cookies = '[Filtered]';
    }
    return event;
  },

  debug: false,
});
