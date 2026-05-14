import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

export const metadata: Metadata = {
  title: "Termos de Uso · bfin",
  description:
    "Termos de uso do bfin. Regras para usar a plataforma, planos Free e Premium, cancelamento e limitações de responsabilidade.",
  alternates: { canonical: "/termos" },
  openGraph: {
    title: "Termos de Uso · bfin",
    description:
      "Termos de uso do bfin. Regras para usar a plataforma, planos Free e Premium, cancelamento e limitações de responsabilidade.",
    url: "/termos",
  },
};

const LAST_UPDATED = "14 de maio de 2026";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />

      <main>
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24 text-center">
            <span className="inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-1 text-[11px] font-semibold tracking-wide text-ink">
              LEGAL
            </span>
            <h1 className="mt-6 text-[36px] font-bold tracking-tight leading-[1.1] md:text-[44px]">
              Termos de <span className="text-rausch">Uso</span>
            </h1>
            <p className="mt-4 text-sm text-muted">
              Última atualização: {LAST_UPDATED}
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <article className="mx-auto max-w-3xl px-6 text-base leading-relaxed text-body-text">
            <h2 className="text-[21px] font-bold text-ink">1. Aceitação</h2>
            <p className="mt-3">
              Ao criar conta e usar o <strong className="text-ink">bfin</strong>
              , você declara ter lido, entendido e concordado com estes Termos
              de Uso e com a{" "}
              <a className="text-rausch hover:underline" href="/privacidade">
                Política de Privacidade
              </a>
              . Se não concorda, não utilize o serviço.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              2. Descrição do serviço
            </h2>
            <p className="mt-3">
              O bfin é uma plataforma de organização financeira pessoal que
              permite lançar entradas e saídas, visualizar saldos e projetar
              cenários futuros. O serviço encontra-se em fase{" "}
              <strong className="text-ink">beta</strong>, podendo sofrer
              alterações, indisponibilidades ou ajustes sem aviso prévio.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              3. Cadastro e conta
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                O cadastro é gratuito e pessoal. É necessário ter pelo menos{" "}
                <strong className="text-ink">18 anos completos</strong>.
              </li>
              <li>
                Você é responsável pelo sigilo da sua senha e por todas as
                atividades realizadas a partir da sua conta.
              </li>
              <li>
                Informações cadastrais devem ser verdadeiras e atualizadas.
              </li>
            </ul>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              4. Uso aceitável
            </h2>
            <p className="mt-3">Você concorda em não:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Tentar acessar dados de outros usuários sem autorização.
              </li>
              <li>
                Realizar engenharia reversa, scraping massivo ou qualquer
                forma de abuso da infraestrutura.
              </li>
              <li>
                Utilizar o serviço para atividades ilegais, fraudulentas ou que
                violem direitos de terceiros.
              </li>
            </ul>
            <p className="mt-3">
              O descumprimento autoriza a suspensão ou encerramento da conta
              sem aviso prévio.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              5. Planos Free e Premium
            </h2>
            <p className="mt-3">
              O bfin oferece um plano{" "}
              <strong className="text-ink">Free</strong> com funcionalidades
              essenciais e um plano{" "}
              <strong className="text-ink">Premium</strong> com recursos
              adicionais. Os preços do Premium são exibidos na página de{" "}
              <a className="text-rausch hover:underline" href="/precos">
                Planos
              </a>{" "}
              e podem ser ajustados a qualquer momento — assinaturas em curso
              respeitam o valor contratado até o fim do ciclo vigente.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              6. Cancelamento
            </h2>
            <p className="mt-3">
              Você pode cancelar a assinatura Premium ou excluir a conta a
              qualquer momento, sem multa. Após a exclusão, seus dados são
              tratados conforme a{" "}
              <a className="text-rausch hover:underline" href="/privacidade">
                Política de Privacidade
              </a>
              .
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              7. Limitação de responsabilidade
            </h2>
            <div className="mt-3 rounded-[14px] border border-hairline bg-surface-soft p-6">
              <p className="font-semibold text-ink">
                O bfin é uma ferramenta de organização financeira pessoal. Não
                é uma instituição financeira, não realiza operações bancárias e
                não presta consultoria de investimento, contábil ou tributária.
              </p>
              <p className="mt-3 text-body-text">
                As projeções, gráficos e sugestões são informativos e baseados
                nos dados que você mesmo lança.{" "}
                <strong className="text-ink">
                  Decisões financeiras são de sua exclusiva responsabilidade.
                </strong>{" "}
                O bfin não se responsabiliza por perdas decorrentes de uso ou
                interpretação das informações apresentadas, nem por
                indisponibilidades temporárias do serviço.
              </p>
            </div>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              8. Propriedade intelectual
            </h2>
            <p className="mt-3">
              Marca, logotipo, código, layout e textos do bfin pertencem ao
              titular do CNPJ 37.592.103/0001-06. O uso da plataforma não
              concede qualquer licença sobre esses elementos.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              9. Alterações destes Termos
            </h2>
            <p className="mt-3">
              Estes Termos podem ser atualizados a qualquer momento. Alterações
              relevantes serão comunicadas por e-mail e/ou aviso no produto,
              com antecedência razoável. O uso continuado após a vigência das
              mudanças significa aceitação.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              10. Lei aplicável e foro
            </h2>
            <p className="mt-3">
              Estes Termos são regidos pelas leis da República Federativa do
              Brasil. Fica eleito o foro da Comarca de{" "}
              <strong className="text-ink">São Paulo/SP</strong> para dirimir
              quaisquer questões decorrentes, com renúncia a qualquer outro,
              por mais privilegiado que seja.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              11. Contato
            </h2>
            <p className="mt-3">
              Dúvidas sobre estes Termos:{" "}
              <a
                className="text-rausch hover:underline"
                href="mailto:contato@bfincont.com.br"
              >
                contato@bfincont.com.br
              </a>
              .
            </p>
          </article>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
