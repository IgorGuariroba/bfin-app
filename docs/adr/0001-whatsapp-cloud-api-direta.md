# Integração WhatsApp via Cloud API Meta direta (sem BSP)

**Status:** accepted

Optamos por integrar o WhatsApp Business Platform diretamente pela **Cloud API da Meta**, sem intermediação de Business Solution Provider (Twilio, 360dialog, Gupshup, Z-API) e sem soluções não-oficiais baseadas em WhatsApp Web (Evolution, Baileys).

## Contexto

Precisamos atender o público da landing page (`bfincont.com.br`) via WhatsApp, com bot de FAQ e handoff para humano. Volume inicial estimado bem abaixo do tier gratuito da Meta (1.000 conversas/mês).

## Considered Options

- **Cloud API direta (escolhida)** — webhook próprio em `/api/whatsapp/webhook`, tokens System User permanentes, custo zero no volume previsto, controle total.
- **BSP (Twilio/360dialog/etc.)** — SDK pronto e setup minutos, mas markup por mensagem e dependência de terceiro para algo que o Next.js já consegue servir.
- **WhatsApp Web não-oficial (Evolution, Z-API tipo Baileys)** — barato e sem aprovação Meta, porém viola ToS e o número pode ser banido — risco operacional inaceitável.

## Consequences

- Precisamos manter validação HMAC do webhook (`X-Hub-Signature-256`) e idempotência por `wamid` por nossa conta.
- Setup inicial depende de verificação de business e display name na Meta (~1-3 dias) — bloqueante para go-live, não para desenvolvimento.
- Trocar para BSP no futuro implica reescrever a camada de envio/recebimento, mas não o modelo de dados (`Contact`/`Conversation`/`WhatsappMessage` permanecem).
