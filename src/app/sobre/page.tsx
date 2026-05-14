import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

export const metadata: Metadata = {
  title: "Sobre · bfin",
  description:
    "Conheça o bfin: ajudamos brasileiros a entender o próprio dinheiro sem virar contador. Feito no Brasil desde 2025.",
  alternates: { canonical: "/sobre" },
  openGraph: {
    title: "Sobre · bfin",
    description:
      "Conheça o bfin: ajudamos brasileiros a entender o próprio dinheiro sem virar contador.",
    url: "/sobre",
  },
};

const PRINCIPLES = [
  {
    title: "Privacidade primeiro",
    desc: "Seus dados financeiros são seus. Sem anúncios, sem venda de informação, sem rastreio invasivo.",
  },
  {
    title: "Simples, não simplório",
    desc: "Interface enxuta esconde uma engine que projeta saldo, organiza tags e antecipa quando o caixa aperta.",
  },
  {
    title: "Feito no Brasil",
    desc: "Pensado para a realidade financeira brasileira, do PIX ao 13º.",
  },
];

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />

      <main>
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24 text-center">
            <span className="inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-1 text-[11px] font-semibold tracking-wide text-ink">
              SOBRE
            </span>
            <h1 className="mt-6 text-[36px] font-bold tracking-tight leading-[1.1] md:text-[44px]">
              Entenda seu dinheiro{" "}
              <span className="text-rausch">sem virar contador</span>.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-body-text">
              É essa a missão do bfin. Ajudar brasileiros a ver, em segundos, o
              que entra, o que sai e o que sobra.
            </p>
          </div>
        </section>

        <section className="border-b border-hairline-soft py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">
              Nossa história
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-body-text">
              <p>
                O bfin nasceu em 2025 da inquietação de quem cansou de
                planilhas quebradas e apps lotados de gráficos que não
                respondem a pergunta mais importante:{" "}
                <strong className="text-ink">
                  quanto sobra no fim do mês?
                </strong>
              </p>
              <p>
                A proposta é direta: lançar entrada e saída em segundos,
                visualizar o saldo dos próximos meses e tomar decisão melhor
                com menos esforço. Sem conectar banco, sem vender dado, sem
                fórmula.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-hairline-soft bg-surface-soft py-16 md:py-24">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">
                Nossos princípios
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {PRINCIPLES.map(({ title, desc }) => (
                <div
                  key={title}
                  className="rounded-[14px] border border-hairline bg-canvas p-6"
                >
                  <h3 className="text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body-text">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">
              Quem faz
            </h2>
            <p className="mt-6 text-base leading-relaxed text-body-text">
              Projeto fundado e mantido por{" "}
              <strong className="text-ink">Igor Guariroba</strong> desde 2025.
            </p>

            <div className="mt-10 rounded-[14px] border border-hairline bg-canvas p-6 text-sm text-body-text">
              <h3 className="mb-3 text-sm font-semibold text-ink">
                Informações da empresa
              </h3>
              <dl className="space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-body-text">CNPJ</dt>
                  <dd className="text-ink">37.592.103/0001-06</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-body-text">Contato</dt>
                  <dd className="text-ink">contato@bfincont.com.br</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
