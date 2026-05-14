import Image from "next/image";
import Link from "next/link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { WhatsAppFloatingButton } from "@/components/landing/whatsapp-floating-button";
import {
  Wallet,
  PieChart,
  Target,
  Bell,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Saldos em tempo real",
    description:
      "Veja todas as contas num só lugar. Sincronize entradas e saídas sem digitar duas vezes.",
  },
  {
    icon: PieChart,
    title: "Categorias e tags",
    description:
      "Entenda pra onde vai seu dinheiro. Relatórios visuais por categoria, mês e tendência.",
  },
  {
    icon: Target,
    title: "Metas e horizonte",
    description:
      "Planeje objetivos financeiros e acompanhe a previsão de saldo nos próximos meses.",
  },
  {
    icon: Bell,
    title: "Lembretes inteligentes",
    description:
      "Sugestões automáticas pra revisar gastos, ajustar metas e não esquecer contas.",
  },
  {
    icon: ShieldCheck,
    title: "Privado e seu",
    description:
      "Seus dados ficam na sua conta. Sem venda de informação, sem rastreio invasivo.",
  },
  {
    icon: Smartphone,
    title: "Funciona no celular",
    description:
      "PWA instalável. Abra como app no Android ou iOS, com suporte offline básico.",
  },
];

const faqs = [
  {
    q: "Quanto tempo leva pra começar a usar?",
    a: "Menos de um minuto. Cria conta com e-mail ou Google, lança a primeira despesa e já vê o saldo do mês. Sem onboarding longo.",
  },
  {
    q: "Quantas contas e cartões posso cadastrar?",
    a: "Sem limite. Conta corrente, poupança, carteira, cartões de crédito — todos no mesmo painel, com saldo consolidado.",
  },
  {
    q: "Dá pra importar extrato OFX ou CSV?",
    a: "Importação de OFX e CSV está no roadmap do beta. Hoje o foco é lançamento manual rápido e recorrências automáticas.",
  },
  {
    q: "Funciona pra mais de uma pessoa ou família?",
    a: "Cada conta é individual no beta. Compartilhamento de carteira entre membros da família está sendo desenhado.",
  },
  {
    q: "Preciso conectar minha conta bancária?",
    a: "Não. O bfin não acessa seu banco. Você lança o que quiser, do jeito que quiser — manual e privado.",
  },
  {
    q: "É grátis mesmo? Vai ter pegadinha?",
    a: "Grátis no beta, sem cartão de crédito. Se surgirem planos pagos no futuro, será por features extras — o básico continua livre.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas pb-20 text-ink md:pb-0">
      <LandingHeader />

      <main>
        <section className="border-b border-hairline-soft">
          <div className="mx-auto grid max-w-[1280px] gap-16 px-6 py-16 md:grid-cols-2 md:py-24">
            <div className="flex flex-col justify-center gap-6">
              <span className="inline-flex w-fit items-center rounded-full border border-hairline bg-canvas px-3 py-1 text-[11px] font-semibold tracking-wide text-ink">
                BETA · GRÁTIS
              </span>
              <h1 className="text-[44px] font-bold leading-[1.1] tracking-tight md:text-[56px]">
                Controle financeiro{" "}
                <span className="text-rausch">sem planilha</span>.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-body-text">
                Saiba em 30 segundos quanto sobra no fim do mês — e nos próximos
                seis. Sem importar extrato, sem fórmula.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-rausch px-6 text-base font-medium text-white transition-colors hover:bg-rausch-active"
                >
                  Criar conta grátis
                </Link>
                <Link
                  href="#como-funciona"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-ink bg-canvas px-6 text-base font-medium text-ink transition-colors hover:bg-surface-soft"
                >
                  Ver como funciona
                </Link>
              </div>
              <p className="text-[13px] text-body-text">
                Grátis no beta. Sem instalar nada, abre direto no navegador.
              </p>
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-[13px] text-body-text">
                <li className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-rausch" />
                  Sem anúncios
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-rausch" />
                  Sem venda de dados
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-rausch" />
                  Feito no Brasil
                </li>
              </ul>
            </div>

            <div className="relative flex items-center justify-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 rounded-full bg-rausch/5 blur-3xl"
              />
              <div className="relative w-full max-w-[420px]">
                <div className="absolute right-0 top-12 hidden w-[58%] rotate-[6deg] sm:block">
                  <div className="relative aspect-[9/19] overflow-hidden rounded-[32px] border-[8px] border-ink bg-canvas shadow-[0_24px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)]">
                    <Image
                      src="/horizonte-de-saldo.png"
                      alt="Projeção de saldo dos próximos meses"
                      fill
                      sizes="(max-width: 768px) 0px, 244px"
                      className="object-cover object-top"
                    />
                  </div>
                </div>

                <div className="relative z-10 mx-auto w-[68%] sm:ml-0 sm:w-[62%] sm:-rotate-[4deg]">
                  <div className="relative aspect-[9/19] overflow-hidden rounded-[36px] border-[9px] border-ink bg-canvas shadow-[0_28px_56px_rgba(0,0,0,0.16),0_6px_16px_rgba(0,0,0,0.08)]">
                    <Image
                      src="/saldos.png"
                      alt="Tela de saldos diários do bfin"
                      fill
                      sizes="(max-width: 768px) 220px, 260px"
                      className="object-cover object-[center_8%]"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-b border-hairline-soft py-16 md:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mx-auto mb-12 max-w-2xl">
              <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">
                Tudo que você precisa pra decidir melhor
              </h2>
              <p className="mt-3 text-base text-body-text">
                Recursos pensados pra quem quer entender o próprio dinheiro sem
                virar contador.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-[14px] border border-hairline bg-canvas p-6 transition-shadow hover:shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_4px_8px_0]"
                >
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-surface-soft text-ink">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-body-text">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="border-b border-hairline-soft bg-surface-soft py-16 md:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mx-auto mb-12 max-w-2xl">
              <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">
                Veja seu dinheiro em movimento
              </h2>
              <p className="mt-3 text-base text-body-text">
                Saldos, lançamentos e horizonte financeiro com leitura clara em
                qualquer tela.
              </p>
            </div>
            <div className="grid gap-10 sm:grid-cols-3 sm:gap-6 md:gap-10">
              {[
                {
                  src: "/totais.png",
                  alt: "Tela de totais do mês",
                  title: "Resumo claro do mês",
                  desc: "Performance, custo de vida e diário médio num panorama só.",
                },
                {
                  src: "/horizonte-de-saldo.png",
                  alt: "Tela de horizonte de saldo",
                  title: "Projeção visual do saldo",
                  desc: "Heatmap de meses futuros mostra quando o caixa aperta.",
                },
                {
                  src: "/tags.png",
                  alt: "Tela de tags",
                  title: "Organize do seu jeito",
                  desc: "Tags do sistema e personalizadas pra agrupar tudo.",
                },
              ].map(({ src, alt, title, desc }) => (
                <div key={src} className="flex flex-col items-center text-center">
                  <div className="relative aspect-[9/19] w-full max-w-[260px] overflow-hidden rounded-[36px] border-[8px] border-ink bg-canvas shadow-[0_16px_32px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.04)]">
                    <Image
                      src={src}
                      alt={alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 260px"
                      className="object-cover object-top"
                    />
                  </div>
                  <h3 className="mt-6 text-base font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-body-text">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="border-b border-hairline-soft py-16 md:py-24"
        >
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-12">
              <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">
                Perguntas frequentes
              </h2>
            </div>
            <div className="divide-y divide-hairline border-y border-hairline">
              {faqs.map(({ q, a }) => (
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

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">
              Pronto pra organizar suas finanças?
            </h2>
            <p className="mt-3 text-base text-muted">
              Crie sua conta em menos de um minuto.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-rausch px-8 text-base font-medium text-white transition-colors hover:bg-rausch-active"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-canvas/95 px-4 py-3 backdrop-blur md:hidden">
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-lg bg-rausch px-6 text-base font-medium text-white transition-colors hover:bg-rausch-active"
        >
          Criar conta grátis
        </Link>
      </div>

      <WhatsAppFloatingButton />
    </div>
  );
}
