import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES } from "@/lib/mercadopago";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Planos e preços · bfin Premium",
  description:
    "Plano Free e Premium do bfin. Mensal ou anual, sem fidelidade. Cancele quando quiser.",
  alternates: { canonical: "/precos" },
  openGraph: {
    title: "Planos e preços · bfin Premium",
    description:
      "Plano Free e Premium do bfin. Mensal ou anual, sem fidelidade. Cancele quando quiser.",
    url: "/precos",
  },
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const fmt = (v: number) => currencyFormatter.format(v);

async function getPrices() {
  const config = await prisma.planConfig.findUnique({ where: { id: "default" } });
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

const PREMIUM_FEATURES = [
  "Tudo do Free",
  "Horizonte de saldo de longo prazo",
  "Compartilhamento de conta com convidados",
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
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-semibold text-ink">Planos bfin</h1>
        <p className="mt-3 text-muted-ink">
          Comece grátis. Faça upgrade quando precisar de mais.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2" aria-label="Comparativo de planos">
        <article className="rounded-lg border border-hairline p-6">
          <h2 className="text-xl font-semibold text-ink">Free</h2>
          <p className="mt-1 text-sm text-muted-ink">Para começar a organizar</p>
          <p className="mt-4 text-3xl font-semibold text-ink">R$ 0</p>
          <ul className="mt-6 space-y-2 text-sm">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border-2 border-amber-500 p-6">
          <h2 className="text-xl font-semibold text-ink">Premium</h2>
          <p className="mt-1 text-sm text-muted-ink">Para quem leva a sério</p>
          <p className="mt-4 text-3xl font-semibold text-ink">
            {fmt(monthly)}
            <span className="text-base font-normal text-muted-ink">/mês</span>
          </p>
          <p className="mt-1 text-sm text-muted-ink">
            ou {fmt(annual)}/ano ({fmt(annualMonthly)}/mês — economiza {savings}%)
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-6 w-full">
            <Link href="/assinar">Assinar Premium</Link>
          </Button>
        </article>
      </section>

      <section className="mt-16" aria-label="Perguntas frequentes">
        <h2 className="mb-6 text-2xl font-semibold text-ink">Perguntas frequentes</h2>
        <dl className="space-y-6">
          {FAQ.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-semibold text-ink">{q}</dt>
              <dd className="mt-1 text-muted-ink">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
