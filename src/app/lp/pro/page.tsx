import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, ShieldCheck, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

// Landing de campanha (ADR-0010): destino do tráfego pago do Google Ads. Uma
// promessa única; oferta em 3 cards estilo SaaS (Free, Pro Anual em destaque,
// Pro Mensal). noindex — é página de mídia paga, não deve competir com /precos
// na busca orgânica.
export const metadata: Metadata = {
  title: "bfin Pro · Assuma o controle das suas finanças",
  description:
    "Histórico completo, horizonte de longo prazo e conta compartilhada. Assine o bfin Pro e veja o ano inteiro das suas finanças.",
  robots: { index: false, follow: true },
};

// CTAs pagos mandam para o login já com o checkout como destino pós-cadastro.
// O login honra ?callbackUrl (caminho interno).
const CTA_HREF = "/login?callbackUrl=%2Fassinar";
const CTA_ANNUAL = "/login?callbackUrl=%2Fassinar%3Fplan%3Dannual";
const CTA_MONTHLY = "/login?callbackUrl=%2Fassinar%3Fplan%3Dmonthly";

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

const PRO_BENEFITS = [
  "Histórico completo, sem limite de meses",
  "Horizonte de saldo de longo prazo",
  "Conta compartilhada com quem você quiser",
  "Assistente IA via MCP (Claude, ChatGPT)",
  "Suporte prioritário",
];

// Cards de oferta — mesma estrutura da /precos.
const FREE_FEATURES = [
  "Saldos diários ilimitados",
  "Tags personalizadas",
  "Previsões mensais por categoria",
];
const PRO_CARD_FEATURES = ["Tudo do Free", ...PRO_BENEFITS];

export default async function LpProPage() {
  const { monthly, annual } = await getPrices();
  const annualMonthly = annual / 12;
  const savings =
    monthly > 0 ? Math.round(((monthly - annualMonthly) / monthly) * 100) : 0;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header mínimo de campanha: só a marca + o próprio CTA. Sem nav — nenhuma
          saída que compita com "Assinar o Pro" (maximiza conversão). */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6">
          <span className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="bfin"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-[22px] font-bold tracking-tight text-rausch">
              bfin
            </span>
          </span>
          <Link
            href={CTA_HREF}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-rausch px-6 text-base font-medium text-white transition-colors hover:bg-rausch-active"
          >
            <Zap className="size-5" aria-hidden />
            Assinar o Pro
          </Link>
        </div>
      </header>

      <main>
        {/* Hero — promessa única + CTA único */}
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1 text-[11px] font-semibold tracking-wide text-rausch">
              <Zap className="size-3.5" aria-hidden />
              BFIN PRO
            </span>
            <h1 className="mt-6 text-[36px] font-bold leading-[1.1] tracking-tight md:text-[48px]">
              Veja o ano inteiro das suas{" "}
              <span className="text-rausch">finanças</span>.
            </h1>
            <p className="mt-4 text-lg text-body-text">
              O bfin Pro libera o histórico completo, o horizonte de longo prazo
              e a conta compartilhada — tudo para você decidir com o quadro
              inteiro à vista.
            </p>
            <Link
              href={CTA_HREF}
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-rausch px-8 text-base font-medium text-white transition-colors hover:bg-rausch-active"
            >
              <Zap className="size-5" aria-hidden />
              Assinar o Pro
            </Link>
            <p className="mt-3 text-sm text-body-text">
              A partir de {fmt(annualMonthly)}/mês · cancele quando quiser
            </p>
          </div>
        </section>

        {/* Benefícios */}
        <section
          className="border-b border-hairline-soft py-16 md:py-24"
          aria-label="O que vem no Pro"
        >
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-[28px] font-bold tracking-tight md:text-[32px]">
              Tudo o que o Pro desbloqueia
            </h2>
            <ul className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
              {PRO_BENEFITS.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-[14px] border border-hairline bg-canvas p-5"
                >
                  <Check
                    className="mt-0.5 size-5 shrink-0 text-rausch"
                    aria-hidden
                  />
                  <span className="text-base text-ink">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Oferta — 3 cards estilo SaaS: Free, Pro Anual (mais popular, ao
            centro no desktop e primeiro no mobile) e Pro Mensal. Preços vêm do
            PlanConfig (banco), com fallback nos defaults. */}
        <section className="py-16 md:py-24" aria-label="Planos e preços">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="relative order-first rounded-[14px] border border-hairline bg-canvas p-8 shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_4px_8px_0] md:order-2">
                <span className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-rausch px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
                  MAIS POPULAR
                </span>
                <h3 className="text-xl font-bold text-ink">Pro Anual</h3>
                <p className="mt-1 text-sm text-body-text">
                  Pague 1×, use o ano todo
                </p>
                <p className="mt-6 text-[36px] font-bold leading-none tracking-tight text-ink">
                  {fmt(annualMonthly)}
                  <span className="text-base font-normal text-body-text">
                    /mês
                  </span>
                </p>
                <p className="mt-1 text-sm text-body-text">
                  {fmt(annual)} cobrado anualmente · economiza {savings}%
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  {PRO_CARD_FEATURES.map((f) => (
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
                  href={CTA_ANNUAL}
                  className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-rausch px-6 text-base font-medium text-white transition-colors hover:bg-rausch-active"
                >
                  <Zap className="size-5" aria-hidden />
                  Assinar anual
                </Link>
              </article>

              <article className="rounded-[14px] border border-hairline bg-canvas p-8 md:order-1">
                <h3 className="text-xl font-bold text-ink">Free</h3>
                <p className="mt-1 text-sm text-body-text">
                  Para começar a organizar
                </p>
                <p className="mt-6 text-[36px] font-bold leading-none tracking-tight text-ink">
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
                  Começar grátis
                </Link>
              </article>

              <article className="rounded-[14px] border border-hairline bg-canvas p-8 md:order-3">
                <h3 className="text-xl font-bold text-ink">Pro Mensal</h3>
                <p className="mt-1 text-sm text-body-text">
                  Flexibilidade total
                </p>
                <p className="mt-6 text-[36px] font-bold leading-none tracking-tight text-ink">
                  {fmt(monthly)}
                  <span className="text-base font-normal text-body-text">
                    /mês
                  </span>
                </p>
                <p className="mt-1 text-sm text-body-text">
                  cobrança mensal recorrente
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  {PRO_CARD_FEATURES.map((f) => (
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
                  href={CTA_MONTHLY}
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
                <p>Cartão de crédito ou Pix. Sem fidelidade.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer mínimo: só copyright + legal (compliance, não distração). */}
      <footer className="border-t border-hairline bg-canvas">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-3 px-6 py-10 text-center text-[13px] text-muted sm:flex-row sm:justify-between sm:text-left">
          <span className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="bfin"
              width={20}
              height={20}
              className="rounded"
            />
            © {new Date().getFullYear()} bfin · Beta no Brasil
          </span>
          <span className="flex gap-5">
            <Link href="/privacidade" className="hover:underline">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:underline">
              Termos
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
