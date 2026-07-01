import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES } from "@/lib/mercadopago";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planos e preços · bfin Pro",
  description:
    "Plano Free e Pro do bfin. Mensal ou anual, sem fidelidade. Cancele quando quiser.",
  alternates: { canonical: "/precos" },
  openGraph: {
    title: "Planos e preços · bfin Pro",
    description:
      "Plano Free e Pro do bfin. Mensal ou anual, sem fidelidade. Cancele quando quiser.",
    url: "/precos",
  },
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const fmt = (v: number) => currencyFormatter.format(v);

async function getPrices() {
  const config = await prisma.planConfig.findUnique({
    where: { id: "default" },
  });
  return {
    monthly: config?.monthlyAmount ?? PLAN_PRICES.monthly.amount,
    annual: config?.annualAmount ?? PLAN_PRICES.annual.amount,
  };
}

const FREE_FEATURES = [
  "Saldos diários ilimitados",
  "Tags personalizadas",
  "Previsões mensais por categoria",
];

const PRO_FEATURES = [
  "Tudo do Free",
  "Horizonte de saldo de longo prazo",
  "Compartilhamento de conta com convidados",
  "Assistente IA via MCP (Claude, ChatGPT)",
  "Suporte prioritário",
];

const FAQ = [
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. O cancelamento é imediato e você mantém acesso até o fim do período pago.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Cobrança via Mercado Pago, recorrente mensal ou anual. Cartão de crédito ou Pix.",
  },
  {
    q: "Posso voltar para o Free depois de assinar?",
    a: "Sim. Ao cancelar, sua conta volta para o Free sem perda de dados.",
  },
];

export default async function PrecosPage() {
  const { monthly, annual } = await getPrices();
  const annualMonthly = annual / 12;
  const savings =
    monthly > 0 ? Math.round(((monthly - annualMonthly) / monthly) * 100) : 0;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />

      <main>
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24 text-center">
            <span className="inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-1 text-[11px] font-semibold tracking-wide text-ink">
              PLANOS
            </span>
            <h1 className="mt-6 text-[36px] font-bold tracking-tight leading-[1.1] md:text-[44px]">
              Comece grátis. Faça <span className="text-rausch">upgrade</span>{" "}
              quando precisar.
            </h1>
            <p className="mt-4 text-base text-body-text">
              Sem fidelidade. Cancele a qualquer momento.
            </p>
          </div>
        </section>

        <section
          className="border-b border-hairline-soft py-16 md:py-24"
          aria-label="Comparativo de planos"
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[14px] border border-hairline bg-canvas p-8">
                <h2 className="text-xl font-bold text-ink">Free</h2>
                <p className="mt-1 text-sm text-body-text">
                  Para começar a organizar
                </p>
                <p className="mt-6 text-[36px] font-bold tracking-tight text-ink">
                  R$ 0
                </p>
                <p className="mt-1 text-sm text-body-text">grátis para sempre</p>
                <ul className="mt-8 space-y-3 text-sm">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-rausch"
                        aria-hidden
                      />
                      <span className="text-ink">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg border border-ink bg-canvas px-6 text-base font-medium text-ink transition-colors hover:bg-surface-soft"
                >
                  Criar conta grátis
                </Link>
              </article>

              <article className="relative rounded-[14px] border border-hairline bg-canvas p-8 shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_4px_8px_0]">
                <span className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-rausch px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
                  MAIS POPULAR
                </span>
                <h2 className="text-xl font-bold text-ink">Pro Anual</h2>
                <p className="mt-1 text-sm text-body-text">
                  Pague 1×, use o ano todo
                </p>
                <p className="mt-6 text-[36px] font-bold tracking-tight text-ink">
                  {fmt(annualMonthly)}
                  <span className="text-base font-normal text-body-text">
                    /mês
                  </span>
                </p>
                <p className="mt-1 text-sm text-body-text">
                  {fmt(annual)} cobrado anualmente · economiza {savings}%
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-rausch"
                        aria-hidden
                      />
                      <span className="text-ink">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/assinar?plan=annual"
                  className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-rausch px-6 text-base font-medium text-white transition-colors hover:bg-rausch-active"
                >
                  Assinar anual
                </Link>
              </article>

              <article className="rounded-[14px] border border-hairline bg-canvas p-8">
                <h2 className="text-xl font-bold text-ink">Pro Mensal</h2>
                <p className="mt-1 text-sm text-body-text">
                  Flexibilidade total
                </p>
                <p className="mt-6 text-[36px] font-bold tracking-tight text-ink">
                  {fmt(monthly)}
                  <span className="text-base font-normal text-body-text">
                    /mês
                  </span>
                </p>
                <p className="mt-1 text-sm text-body-text">
                  cobrança mensal recorrente
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-rausch"
                        aria-hidden
                      />
                      <span className="text-ink">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/assinar?plan=monthly"
                  className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg border border-ink bg-canvas px-6 text-base font-medium text-ink transition-colors hover:bg-surface-soft"
                >
                  Assinar mensal
                </Link>
              </article>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 rounded-[14px] border border-hairline bg-surface-soft px-6 py-5 text-center sm:flex-row sm:justify-center sm:text-left">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <div className="text-sm text-body-text">
                <p className="font-semibold text-ink">
                  Pagamento seguro via Mercado Pago
                </p>
                <p>
                  Cartão de crédito ou Pix. Sem fidelidade — cancele a qualquer
                  momento.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24" aria-label="Perguntas frequentes">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">
              Perguntas frequentes
            </h2>
            <div className="mt-10 divide-y divide-hairline border-y border-hairline">
              {FAQ.map(({ q, a }) => (
                <details
                  key={q}
                  className="group py-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-ink">
                    {q}
                    <span className="text-2xl font-light text-ink transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-body-text">
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
