import { registerOTel } from '@vercel/otel';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

export function register() {
  registerOTel({
    serviceName: 'bfin-app',
    instrumentations: [new PgInstrumentation()],
  });
}
