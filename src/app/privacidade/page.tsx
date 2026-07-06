import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

export const metadata: Metadata = {
  title: "Política de Privacidade · bfin",
  description:
    "Política de privacidade do bfin conforme a LGPD. Saiba quais dados coletamos, por quê, e seus direitos como titular.",
  alternates: { canonical: "/privacidade" },
  openGraph: {
    title: "Política de Privacidade · bfin",
    description:
      "Política de privacidade do bfin conforme a LGPD. Saiba quais dados coletamos, por quê, e seus direitos como titular.",
    url: "/privacidade",
  },
};

const LAST_UPDATED = "14 de maio de 2026";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />

      <main>
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24 text-center">
            <span className="inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-1 text-[11px] font-semibold tracking-wide text-ink">
              LGPD
            </span>
            <h1 className="mt-6 text-[36px] font-bold tracking-tight leading-[1.1] md:text-[44px]">
              Política de <span className="text-rausch">Privacidade</span>
            </h1>
            <p className="mt-4 text-sm text-muted">
              Última atualização: {LAST_UPDATED}
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <article className="mx-auto max-w-3xl px-6 text-base leading-relaxed text-body-text">
            <p className="text-base leading-relaxed text-body-text">
              Esta Política descreve como o{" "}
              <strong className="text-ink">bfin</strong> coleta, usa,
              compartilha e protege dados pessoais, em conformidade com a Lei
              Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              1. Controlador dos dados
            </h2>
            <p className="mt-3">
              Igor Guariroba — CNPJ 37.592.103/0001-06.
              <br />
              Contato:{" "}
              <a
                className="text-rausch hover:underline"
                href="mailto:contato@bfincont.com.br"
              >
                contato@bfincont.com.br
              </a>
              .
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              2. Dados que coletamos
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-ink">Cadastro:</strong> nome, e-mail e
                senha (armazenada com hash). Quando você usa login Google,
                recebemos nome, e-mail e foto de perfil.
              </li>
              <li>
                <strong className="text-ink">
                  Dados financeiros próprios:
                </strong>{" "}
                lançamentos, tags, metas (previsões) e saldos que você cadastra
                manualmente. O bfin não acessa contas bancárias.
              </li>
              <li>
                <strong className="text-ink">Dados técnicos:</strong> cookies
                essenciais de sessão para manter o login ativo. Não usamos
                cookies de rastreamento publicitário.
              </li>
            </ul>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              3. Finalidades
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Permitir o acesso e funcionamento da sua conta.</li>
              <li>
                Prestar o serviço de organização financeira (lançamentos,
                projeções, relatórios).
              </li>
              <li>Responder dúvidas de suporte por e-mail.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              4. Base legal
            </h2>
            <p className="mt-3">
              O tratamento ocorre com base em (a){" "}
              <strong className="text-ink">execução de contrato</strong> entre
              você e o bfin, (b){" "}
              <strong className="text-ink">consentimento</strong> quando
              expressamente solicitado e (c){" "}
              <strong className="text-ink">
                cumprimento de obrigação legal
              </strong>
              .
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              5. Compartilhamento com terceiros
            </h2>
            <p className="mt-3">
              Não vendemos seus dados. Compartilhamos apenas com prestadores
              necessários para o serviço funcionar:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-ink">Google</strong> — autenticação
                OAuth, caso você opte por entrar com Google.
              </li>
              <li>
                <strong className="text-ink">Provedor de hospedagem</strong> —
                VPS localizada no Brasil, responsável por armazenar dados e
                processar requisições.
              </li>
            </ul>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              6. Armazenamento e retenção
            </h2>
            <p className="mt-3">
              Os dados ficam armazenados em servidor no Brasil enquanto sua
              conta estiver ativa. Após pedido de exclusão ou cancelamento,
              mantemos os dados por até{" "}
              <strong className="text-ink">30 dias</strong> em estado inativo
              (caso você queira reativar a conta) e, em seguida, fazemos a
              exclusão definitiva, salvo retenção exigida por lei.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              7. Seus direitos como titular
            </h2>
            <p className="mt-3">Você pode, a qualquer momento, solicitar:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Confirmação da existência de tratamento.</li>
              <li>Acesso aos seus dados.</li>
              <li>Correção de dados incompletos ou desatualizados.</li>
              <li>
                Anonimização, bloqueio ou eliminação de dados desnecessários.
              </li>
              <li>Portabilidade dos dados.</li>
              <li>Revogação do consentimento.</li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer direito, escreva para{" "}
              <a
                className="text-rausch hover:underline"
                href="mailto:contato@bfincont.com.br"
              >
                contato@bfincont.com.br
              </a>
              .
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              8. Segurança da informação
            </h2>
            <p className="mt-3">
              Adotamos medidas técnicas e administrativas razoáveis para
              proteger seus dados, como criptografia em trânsito (HTTPS), hash
              de senhas e controle de acesso aos servidores. Nenhum sistema é
              100% seguro — em caso de incidente, comunicaremos os titulares
              afetados e a ANPD nos prazos legais.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              9. Analytics e métricas
            </h2>
            <p className="mt-3">
              Hoje o bfin não utiliza ferramentas de analytics ou rastreamento
              de terceiros. Caso passemos a adotar (ex.: análise agregada de
              uso), atualizaremos esta Política e comunicaremos os usuários
              previamente.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              10. Alterações nesta Política
            </h2>
            <p className="mt-3">
              Podemos atualizar esta Política periodicamente. Mudanças
              relevantes serão informadas por e-mail e/ou aviso no produto.
            </p>

            <h2 className="mt-12 text-[21px] font-bold text-ink">
              11. Encarregado (DPO) e contato
            </h2>
            <p className="mt-3">
              Encarregado pelo tratamento de dados: Igor Guariroba.
              <br />
              E-mail:{" "}
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
