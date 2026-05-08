# Grafana Cloud — Setup Manual (pós-deploy)

## 1. Synthetic Monitoring (Uptime)

1. Grafana Cloud → **Synthetic Monitoring** → **Add Check**
2. Tipo: **HTTP**
3. URL: `https://<dominio-prod>/api/health`
4. Frequência: `1m`
5. Regiões: `sa-east-1` + `us-east-1` + `eu-west-1`
6. Success condition: status `200`, body contém `"ok":true`
7. Salvar

## 2. Alerta — Health check caiu

1. **Alerting** → **Alert rules** → **New rule**
2. Data source: **Synthetic Monitoring**
3. Query: `probe_success{job="bfin-health"} == 0`
4. Condição: FOR `2m`
5. Severity: `critical`
6. Contact: Slack / email

## 3. Alerta — Error rate (Faro RUM)

Faro envia métricas de erro automaticamente via Frontend Observability.

1. **Alerting** → **Alert rules** → **New rule**
2. Data source: **Grafana Cloud Frontend Observability** (ou Prometheus se exposto)
3. Query sugerida (ajustar ao schema Faro):
   ```promql
   sum(rate(faro_measurements_total{app="bfin-app", kind="error"}[5m]))
   /
   sum(rate(faro_measurements_total{app="bfin-app"}[5m]))
   ```
4. Condição: > `0.01` (1%) FOR `5m`
5. Contact: Slack / email

> Alternativa: Frontend Observability → **Alerts** → built-in alert por app (mais simples).

## 4. Alerta — Latência p95 (OTel traces)

1. Data source: **Tempo** ou **Prometheus** (via Tempo metrics)
2. Query (Tempo metrics generator, se habilitado):
   ```promql
   histogram_quantile(0.95,
     sum(rate(traces_spanmetrics_duration_milliseconds_bucket{service="bfin-app"}[5m]))
     by (le)
   )
   ```
3. Condição: > `1000` (ms) FOR `10m`

## Checklist pós-deploy

- [ ] `/api/health` retorna 200 em produção
- [ ] Synthetic check criado e verde
- [ ] Alerta health configurado
- [ ] Alerta error rate configurado
- [ ] Contact point (Slack/email) configurado
