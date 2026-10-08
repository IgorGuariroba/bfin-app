import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { sanitizeFaro } from '@/lib/faro-privacy';
import { setFaro } from '@/lib/faro';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FARO_URL) {
  const faro = initializeFaro({
    url: process.env.NEXT_PUBLIC_FARO_URL!,
    app: {
      name: 'bfin-app',
      version: process.env.NEXT_PUBLIC_SERVICE_VERSION ?? 'unknown',
      environment: process.env.NODE_ENV,
    },
    beforeSend: sanitizeFaro,
    instrumentations: [...getWebInstrumentations({ captureConsole: false }), new TracingInstrumentation({
      instrumentationOptions: { propagateTraceHeaderCorsUrls: [/^https:\/\/bfincont\.com\.br\//] },
    })],
  });

  setFaro(faro);
}
