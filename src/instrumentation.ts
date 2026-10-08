import { registerOTel } from '@vercel/otel';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

export function register() {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;
  registerOTel({
    serviceName: 'bfin-app',
    metricReaders: [new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter(), exportIntervalMillis: 60000 })],
    attributes: { 'service.version': process.env.SERVICE_VERSION ?? 'unknown', 'deployment.environment.name': 'production' },
    instrumentations: ['fetch', new PgInstrumentation({ enhancedDatabaseReporting: false })],
  });
}
