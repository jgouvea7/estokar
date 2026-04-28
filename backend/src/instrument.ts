import * as Sentry from '@sentry/nestjs';
import 'dotenv/config';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});