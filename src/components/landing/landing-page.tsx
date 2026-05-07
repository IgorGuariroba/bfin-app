import Image from "next/image";
import Link from "next/link";
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
    q: "O bfin é gratuito?",
    a: "Sim, o uso pessoal é gratuito durante o beta. Planos pagos podem surgir no futuro com features avançadas.",
  },
  {
    q: "Preciso conectar minha conta bancária?",
    a: "Não. O bfin funciona com lançamentos manuais e importação. Conexão bancária automática é opcional e está em desenvolvimento.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Os dados ficam vinculados à sua conta autenticada. Não vendemos nem compartilhamos suas informações financeiras.",
  },
  {
    q: "Funciona offline?",
    a: "Como PWA, o bfin guarda recursos localmente e abre rápido. Operações que dependem de servidor exigem conexão.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
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
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-base font-semibold text-ink hover:underline underline-offset-4"
            >
              Recursos
            </Link>
            <Link
              href="#faq"
              className="text-base font-semibold text-ink hover:underline underline-offset-4"
            >
              FAQ
            </Link>
          </nav>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-rausch px-6 text-base font-medium text-white transition-colors hover:bg-rausch-active"
          >
            Entrar
          </Link>
        </div>
      </header>

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
                Organize gastos, metas e investimentos num só lugar. Simples,
                rápido, no seu bolso.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-rausch px-6 text-base font-medium text-white transition-colors hover:bg-rausch-active"
                >
                  Criar conta grátis
                </Link>
                <Link
                  href="#features"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-ink bg-canvas px-6 text-base font-medium text-ink transition-colors hover:bg-surface-soft"
                >
                  Ver recursos
                </Link>
              </div>
              <p className="text-[13px] text-body-text">
                Sem cartão de crédito. Cancele quando quiser.
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-[320px]">
                <div className="relative aspect-[9/19] overflow-hidden rounded-[40px] border-[10px] border-ink bg-canvas shadow-[0_20px_40px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
                  <Image
                    src="/saldos.png"
                    alt="Tela de saldos diários do bfin"
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-cover object-[center_8%]"
                    priority
                  />
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

        <section className="border-b border-hairline-soft bg-surface-soft py-16 md:py-24">
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

      <footer className="border-t border-hairline bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h4 className="mb-4 text-base font-medium text-ink">Suporte</h4>
              <ul className="space-y-3 text-sm text-ink">
                <li>
                  <Link href="#faq" className="hover:underline">
                    Central de ajuda
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:underline">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-base font-medium text-ink">Produto</h4>
              <ul className="space-y-3 text-sm text-ink">
                <li>
                  <Link href="#features" className="hover:underline">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:underline">
                    Entrar
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-base font-medium text-ink">bfin</h4>
              <ul className="space-y-3 text-sm text-ink">
                <li>
                  <Link href="/" className="hover:underline">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:underline">
                    Criar conta
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-6 text-[13px] text-muted md:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/icon.png"
                alt="bfin"
                width={20}
                height={20}
                className="rounded"
              />
              <span>© {new Date().getFullYear()} bfin</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:underline">
                Termos
              </Link>
              <Link href="#" className="hover:underline">
                Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
