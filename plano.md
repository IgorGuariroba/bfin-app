# Plano: Integração Mercado Pago — Freemium bfin-app

## Contexto

App já tem campo `plan String @default("free")` no User e gating de features (histórico 3 meses, convites). Falta o fluxo real de cobrança. Usuário quer assinatura mensal (R$14,90) e anual (R$119,90) via Mercado Pago Subscriptions (PreApproval), com página de preços, webhook para ativar plano e cancelamento com data de renovação visível.

---

## 1. Schema Prisma

**Arquivo:** `prisma/schema.prisma`

Adicionar ao model `User`:
```prisma
planExpiresAt    DateTime?
mpSubscriptionId String?
```

Rodar: `npx prisma migrate dev --name add_plan_subscription_fields`

---

## 2. Dependência

```bash
npm install mercadopago
```

---

## 3. Variáveis de Ambiente

Adicionar em `.env` e `.env.example`:
```
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
```

---

## 4. src/lib/mercadopago.ts (novo)

Cliente singleton do SDK:
```ts
import "server-only";
import { MercadoPagoConfig } from "mercadopago";

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export const PLAN_PRICES = {
  monthly: { amount: 14.90, label: "Mensal", billingDays: 30 },
  annual:  { amount: 119.90, label: "Anual",  billingDays: 365 },
} as const;
export type BillingCycle = keyof typeof PLAN_PRICES;
```

---

## 5. src/lib/plan.ts (atualizar)

`getUserPlan` deve checar `planExpiresAt` — se expirado, retorna `"free"`:
```ts
export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  if (!user || user.plan !== "pro") return "free";
  if (user.planExpiresAt && user.planExpiresAt < new Date()) {
    await prisma.user.update({ where: { id: userId }, data: { plan: "free" } });
    return "free";
  }
  return "pro";
}
```

---

## 6. src/app/api/checkout/route.ts (novo)

`POST` — cria PreApproval no MP e retorna `init_point`:
```ts
import "server-only";
import { auth } from "@/lib/auth";
import { PreApproval } from "mercadopago";
import { mpClient, PLAN_PRICES, BillingCycle } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { cycle } = await request.json() as { cycle: BillingCycle };
  const price = PLAN_PRICES[cycle];
  if (!price) return Response.json({ error: "Ciclo inválido" }, { status: 400 });

  const origin = process.env.AUTH_URL?.replace(/\/$/, "") ?? request.nextUrl.origin;

  const preApproval = new PreApproval(mpClient);
  const sub = await preApproval.create({
    body: {
      reason: `bfin Pro — ${price.label}`,
      payer_email: session.user.email!,
      auto_recurring: {
        frequency: cycle === "annual" ? 12 : 1,
        frequency_type: "months",
        transaction_amount: price.amount,
        currency_id: "BRL",
      },
      back_url: `${origin}/assinar?success=true`,
      notification_url: `${origin}/api/webhook/mercadopago`,
      external_reference: `${session.user.id}:${cycle}`,
    },
  });

  return Response.json({ init_point: sub.init_point });
}
```

---

## 7. src/app/api/webhook/mercadopago/route.ts (novo)

`POST` — recebe eventos de assinatura do MP:
```ts
import "server-only";
import { PreApproval } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body;

  if (type !== "subscription_preapproval" || !data?.id) {
    return Response.json({ ok: true });
  }

  const preApproval = new PreApproval(mpClient);
  const sub = await preApproval.get({ preApprovalId: data.id });

  // external_reference = "userId:cycle"
  const [userId, cycle] = (sub.external_reference ?? "").split(":");
  if (!userId) return Response.json({ ok: true });

  if (sub.status === "authorized") {
    const billingDays = cycle === "annual" ? 365 : 30;
    const planExpiresAt = new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "pro", planExpiresAt, mpSubscriptionId: sub.id },
    });
  } else if (sub.status === "cancelled" || sub.status === "paused") {
    await prisma.user.update({
      where: { id: userId },
      data: { mpSubscriptionId: null },
    });
  }

  return Response.json({ ok: true });
}
```

---

## 8. src/app/api/subscription/route.ts (novo)

`GET` — retorna status da assinatura:
```ts
// Retorna: { plan, planExpiresAt, mpSubscriptionId }
```

`DELETE` — cancela assinatura no MP:
```ts
// preApproval.update({ preApprovalId, body: { status: "cancelled" } })
// prisma.user.update({ data: { mpSubscriptionId: null } })
```

---

## 9. src/app/(app)/assinar/page.tsx (novo)

Página client com dois cards de plano:

**Se plan === "free":**
- Card Mensal: R$14,90/mês + botão "Assinar" → POST /api/checkout { cycle: "monthly" } → redirect init_point
- Card Anual: R$119,90/ano + badge "33% off" + botão "Assinar" → POST /api/checkout { cycle: "annual" } → redirect init_point
- Query param `?success=true` → banner "Assinatura em processamento"

**Se plan === "pro":**
- Status "Plano Pro ativo"
- Próxima renovação: `planExpiresAt` formatado
- Botão "Cancelar assinatura" → DELETE /api/subscription + confirmação modal

---

## 10. src/app/(app)/menu/page.tsx (modificar)

Se `plan === "free"`, inserir item com destaque no topo da lista:
```ts
{ icon: Zap, label: "Assinar Pro", href: "/assinar", highlight: true }
```

---

## Fluxo Completo

```
Usuário clica "Assinar Mensal"
  → POST /api/checkout { cycle: "monthly" }
  → Redirect para init_point do Mercado Pago
  → Usuário autoriza no MP
  → MP redireciona para /assinar?success=true
  → MP envia POST /api/webhook/mercadopago
  → Webhook: status=authorized → user.plan="pro", planExpiresAt=now+30d
  → Na próxima visita: layout Server Component lê plan="pro" → PlanProvider atualizado
```

---

## Arquivos Críticos

| Ação     | Arquivo                                              |
|----------|------------------------------------------------------|
| Modificar | `prisma/schema.prisma`                              |
| Modificar | `src/lib/plan.ts`                                   |
| Modificar | `src/app/(app)/menu/page.tsx`                       |
| Criar    | `src/lib/mercadopago.ts`                             |
| Criar    | `src/app/api/checkout/route.ts`                      |
| Criar    | `src/app/api/webhook/mercadopago/route.ts`           |
| Criar    | `src/app/api/subscription/route.ts`                  |
| Criar    | `src/app/(app)/assinar/page.tsx`                     |
| Modificar | `.env.example`                                      |

---

## Verificação

1. `npm run dev` — sem erros TypeScript
2. Playwright: navegar `/assinar`, verificar cards de preço
3. Testar com access token sandbox do MP:
   - Criar assinatura → verificar `init_point` válido
   - Simular webhook `authorized` → verificar `user.plan="pro"` no banco
4. Verificar que `/saldos` mostra meses anteriores após upgrade
5. Verificar botão cancelar → chama DELETE → limpa `mpSubscriptionId`
