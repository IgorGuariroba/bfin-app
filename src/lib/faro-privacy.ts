import { TransportItemType, type TransportItem, type ExceptionEvent, type MeasurementEvent, type TraceEvent } from '@grafana/faro-web-sdk';

/** Não enviar identidade, URL, texto livre, eventos de UI ou argumentos. */
export function sanitizeFaro(item: TransportItem): TransportItem | null {
  const meta = { app: item.meta.app, sdk: item.meta.sdk };
  if (item.type === TransportItemType.EXCEPTION) {
    const p = item.payload as ExceptionEvent;
    return { ...item, meta, payload: { timestamp: p.timestamp, type: /^[A-Za-z]+Error$/.test(p.type) ? p.type : 'Error', value: 'Browser error', trace: p.trace } };
  }
  if (item.type === TransportItemType.MEASUREMENT) {
    const p = item.payload as MeasurementEvent;
    return { ...item, meta, payload: { timestamp: p.timestamp, type: p.type, values: p.values, trace: p.trace } };
  }
  if (item.type === TransportItemType.TRACE) {
    const p = structuredClone(item.payload) as TraceEvent;
    for (const resource of p.resourceSpans ?? []) {
      resource.resource = { droppedAttributesCount: 0, attributes: [
        { key: "service.name", value: { stringValue: "bfin-browser" } },
        { key: "service.version", value: { stringValue: item.meta.app?.version ?? "unknown" } },
        { key: "deployment.environment.name", value: { stringValue: "production" } },
      ] };
      for (const scope of resource.scopeSpans ?? []) {
        for (const span of scope.spans ?? []) {
          span.name = 'browser.request';
          span.attributes = (span.attributes ?? []).filter(a => ['http.method', 'http.request.method', 'http.status_code', 'http.response.status_code'].includes(a.key));
          span.events = [];
          if (span.status) span.status.message = '';
        }
      }
    }
    return { ...item, meta, payload: p };
  }
  return null;
}
