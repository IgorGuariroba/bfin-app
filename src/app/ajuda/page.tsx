import type { Metadata } from "next";
import Link from "next/link";
import { Lightbulb, Mail } from "lucide-react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

export const metadata: Metadata = {
  title: "Ajuda · bfin",
  description:
    "Respostas rápidas para as dúvidas mais comuns sobre o bfin. Saldos, categorias, horizonte, previsões, tags e compartilhamento.",
  alternates: { canonical: "/ajuda" },
  openGraph: {
    title: "Ajuda · bfin",
    description:
      "Respostas rápidas para as dúvidas mais comuns sobre o bfin.",
    url: "/ajuda",
  },
};

type FaqItem = { q: string; a: React.ReactNode };

const FAQ: FaqItem[] = [
  {
    q: "O que é o saldo diário?",
    a: (
      <>
        É a soma acumulada de entradas, saídas, gastos diários, economia e
        cartão até o dia atual do mês. Cada linha em{" "}
        <strong>Saldos</strong> mostra como o saldo evolui dia a dia.
      </>
    ),
  },
  {
    q: "Como funcionam as categorias (E, S, D, G, C)?",
    a: (
      <>
        <strong>E</strong> entrada · <strong>S</strong> saída fixa ·{" "}
        <strong>D</strong> diário (gastos do dia) · <strong>G</strong> economia
        guardada · <strong>C</strong> cartão de crédito. Cada movimentação
        pertence a uma dessas cinco categorias.
      </>
    ),
  },
  {
    q: "O que é o Horizonte de saldos?",
    a: (
      <>
        Visão de 3 meses lado a lado mostrando o saldo acumulado de cada dia,
        com gradiente de cor para indicar dias positivos (verde) ou negativos
        (vermelho). Útil para enxergar tendências.
      </>
    ),
  },
  {
    q: "Para que serve a Previsão de diário?",
    a: (
      <>
        Define um valor previsto de gasto diário. O app compara o diário médio
        real com a previsão para sinalizar se você está dentro ou fora da
        meta.
      </>
    ),
  },
  {
    q: "Como uso as Tags?",
    a: (
      <>
        Tags ajudam a classificar movimentações além da categoria. Crie tags
        próprias em <strong>Tags</strong> e marque transações ao
        registrá-las.
      </>
    ),
  },
  {
    q: "Posso compartilhar minha conta?",
    a: (
      <>
        Sim. Em <strong>Configurações</strong> você convida outra pessoa por
        email. Ela recebe um link e passa a operar a mesma base de dados.
      </>
    ),
  },
  {
    q: "Como envio uma sugestão ou reporto um bug?",
    a: (
      <>
        Use a tela de <strong>Sugestões</strong> no menu. Sua mensagem chega
        direto pra equipe.
      </>
    ),
  },
  {
    q: "Meus dados ficam seguros?",
    a: (
      <>
        Sim. Autenticação via Google ou senha, sessões assinadas, dados
        isolados por usuário no banco. Não compartilhamos com terceiros.
      </>
    ),
  },
];

export default function AjudaPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />

      <main>
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24 text-center">
            <span className="inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-1 text-[11px] font-semibold tracking-wide text-ink">
              AJUDA
            </span>
            <h1 className="mt-6 text-[36px] font-bold tracking-tight leading-[1.1] md:text-[44px]">
              Como podemos <span className="text-rausch">ajudar?</span>
            </h1>
            <p className="mt-4 text-base text-body-text">
              Respostas rápidas para as dúvidas mais comuns sobre o app.
            </p>
          </div>
        </section>

        <section
          className="border-b border-hairline-soft py-16 md:py-24"
          aria-label="Perguntas frequentes"
        >
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
                  <div className="mt-3 text-sm leading-relaxed text-body-text">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">
              Não achou o que procurava?
            </h2>
            <p className="mt-3 text-base text-body-text">
              Fale com a gente direto pelos canais abaixo.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/sugestoes"
                className="group rounded-[14px] border border-hairline bg-canvas p-6 transition-shadow hover:shadow-[rgba(0,0,0,0.04)_0_2px_8px_0]"
              >
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-surface-soft text-ink">
                  <Lightbulb className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">
                  Enviar sugestão
                </h3>
                <p className="mt-1 text-sm text-body-text">
                  Ideia, melhoria ou problema (requer login).
                </p>
              </Link>
              <a
                href="mailto:contato@bfincont.com.br"
                className="group rounded-[14px] border border-hairline bg-canvas p-6 transition-shadow hover:shadow-[rgba(0,0,0,0.04)_0_2px_8px_0]"
              >
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-surface-soft text-ink">
                  <Mail className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">
                  Falar por e-mail
                </h3>
                <p className="mt-1 text-sm text-body-text">
                  contato@bfincont.com.br
                </p>
              </a>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
