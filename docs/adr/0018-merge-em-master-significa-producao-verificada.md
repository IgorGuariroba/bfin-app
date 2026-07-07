# 18. Merge em master significa produção verificada (CD com smoke pós-deploy)

Data: 2026-07-07

Status: Aceito

## Contexto

Com a trilha da ADR-0017 completa, o ciclo dev→prod do bfin-app tem os seguintes fatos:

- O Dokploy **já auto-deploya** a cada push em master — merge de PR é deploy. Mas nada verifica produção depois: o synthetic monitora só `/api/health`, e a routine de Detecção (ADR-0008) é horária e desacoplada do deploy.
- Essa lacuna já custou caro: o billing ficou quebrado em produção do merge da #186 até o #188 (env vars fora do compose) e o webhook do MercadoPago nunca tinha funcionado fim-a-fim até o #190 (URL sem path no painel) — tudo com health check verde o tempo inteiro.
- O CI do bfin-app testa contra o `bfin-backend@master` sem pinagem (deliberado: é o que roda em prod), mas uma quebra de contrato causada por um merge no backend só aparece **no próximo PR do frontend** — dias depois, atribuída ao lado errado. O CI do backend não exercita o gateway daqui.
- Falha de workflow do GitHub não entra no loop de ninguém: a routine de Detecção lê só o Grafana.
- No local, o pre-commit (ADR-0015) roda `tsc` + `knip` + `jscpd` full-repo em todo commit, e pre-push não existe — o peso está todo na ponta errada.

## Decisão

**Merge em master passa a significar "está em produção e verificado", sem passo humano.** Cinco mudanças concretizam isso:

1. **Smoke pós-deploy** (novo workflow, `on: push` em master): espera o deploy do Dokploy concluir e roda contra `bfincont.com.br`, nesta ordem:
   - `/api/health` responde `200 {"ok":true}`;
   - login real com usuário sintético (credentials, dados descartáveis);
   - `GET /api/totais` autenticado — atravessa gateway → backend → Postgres;
   - `POST /api/webhook/mercadopago` **sem assinatura** → espera `401` (se vier 404/307/500, a rota sumiu, o proxy barrou ou env var caiu — as três falhas reais do #186–#190). A rota vive no bfin-backend, mas o smoke bate na URL pública, exercitando o roteamento Traefik→backend inteiro.
2. **CI reverso por dispatch**: o bfin-backend ganha um passo pós-merge que dispara o workflow do bfin-app via `repository_dispatch`. A dependência de `backend@master` no CI daqui continua (fiel à prod); a quebra cruzada passa a aparecer no momento do merge do backend, atribuída a ele.
3. **Sinais de pipeline entram no loop de detecção**: smoke vermelho ou CI reverso vermelho notifica o Discord **e** abre/atualiza issue `[detection:<chave>]` (mesma convenção do playbook ADR-0008, que a routine horária já sabe atualizar e fechar). Correção e merge continuam humanos — sem auto-merge de fix por máquina.
4. **Alerta de error-rate do bfin-backend** no Grafana: o backend já shippa logs estruturados pro Loki (`service_name="bfin-backend"`, verificado em 2026-07-07); falta só a regra de alerta, espelhando a `bfin-frontend-error-rate`.
5. **Hooks locais rebalanceados** (revisa a ADR-0015): pre-commit fica só com `lint-staged` (eslint --fix + `vitest related --project unit` nos staged); `tsc --noEmit`, `knip` e `jscpd` migram para um novo pre-push. Uma rodada de trabalho paga o full-repo uma vez, no push, não a cada commit.

## Consequências

**Positivas:**
- A classe de falha "deployou quebrado e ninguém viu" (billing #186–#190) passa a ser detectada minutos após o merge, correlacionada ao deploy que a causou.
- Quebra de contrato entre repos aparece no lado que a causou, no momento em que a causou.
- Todo sinal vermelho (Grafana, smoke, CI reverso) converge para o mesmo funil: Discord para urgência, issue `[detection:*]` para trabalho rastreável.

**Negativas / trade-offs aceitos:**
- O smoke exige um usuário sintético em produção (credencial em secret do GitHub) e dados descartáveis — superfície nova para higiene.
- `repository_dispatch` exige um token cross-repo no bfin-backend (mais um secret para rotacionar).
- Push local fica mais lento (herda tsc+knip+jscpd); quebra de tsc pode ser descoberta só no push, commits intermediários podem não tipar.
- Smoke não testa pagamento real — o guard do 401 prova que o canal existe, roteia e valida assinatura; não prova processamento de evento assinado.

## Alternativas descartadas

- **Pinar o backend por SHA no CI**: reprodutível, mas CI verde deixaria de significar "funciona com o backend que está em prod" — contradiz a meta de CD.
- **Synthetic multi-step no Grafana em vez de Action**: rodaria contínuo (pegaria quebra fora de deploy), mas multi-step autenticado é limitado no Grafana Cloud e não correlaciona com o merge. Pode complementar depois, não substitui.
- **Fechar o loop até auto-merge de fix agêntico**: draft PR red→green já é permitido (ADR-0008); merge automático foi rejeitado — o review de máquina não é gate bloqueante e não há histórico de precisão dos fixes.
- **Pre-push com suíte de integração**: exigiria bfin-backend rodando localmente (hoje 19/44 testes falham sem ele); custo de orquestração local não paga — integração fica no CI.
