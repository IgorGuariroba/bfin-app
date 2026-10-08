import pino from 'pino';
import { context, trace } from '@opentelemetry/api';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'bfin-app', environment: 'production', version: process.env.SERVICE_VERSION ?? 'unknown' },
  redact: ['authorization', 'cookie', 'token', 'password', 'headers', 'body', 'user', 'email', 'ip', 'name', 'message', 'prompt', 'payload', '*.authorization', '*.token', '*.password'],
  serializers: { err: (err: unknown) => ({ type: err instanceof Error ? err.name : 'UnknownError' }) },
  mixin() {
    const span = trace.getSpan(context.active())?.spanContext();
    return span && trace.isSpanContextValid(span) ? { trace_id: span.traceId, span_id: span.spanId } : {};
  },
  // stdout JSON é a fonte única; o Alloy faz a exportação local autenticada.
});
