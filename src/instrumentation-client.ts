import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { setFaro } from '@/lib/faro';

if (typeof window !== 'undefined') {
  const faro = initializeFaro({
    url: process.env.NEXT_PUBLIC_FARO_URL!,
    app: {
      name: 'bfin-app',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
    },
    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
  });

  setFaro(faro);
}
