"use client";

import Link from "next/link";
import { ChevronDown, Lightbulb, Mail } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";

type FaqItem = { q: string; a: React.ReactNode };

const FAQ: FaqItem[] = [
  {
    q: "O que é o saldo diário?",
    a: (
      <>
        É a soma acumulada de entradas, saídas, gastos diários, economia e cartão até
        o dia atual do mês. Cada linha em <strong>Saldos</strong> mostra como o saldo
        evolui dia a dia.
      </>
    ),
  },
  {
    q: "Como funcionam as categorias (E, S, D, G, C)?",
    a: (
      <>
        <strong>E</strong> entrada · <strong>S</strong> saída fixa ·{" "}
        <strong>D</strong> diário (gastos do dia) · <strong>G</strong> economia
        guardada · <strong>C</strong> cartão de crédito. Cada movimentação pertence a
        uma dessas cinco categorias.
      </>
    ),
  },
  {
    q: "O que é o Horizonte de saldos?",
    a: (
      <>
        Visão de 3 meses lado a lado mostrando o saldo acumulado de cada dia, com
        gradiente de cor para indicar dias positivos (verde) ou negativos (vermelho).
        Útil para enxergar tendências.
      </>
    ),
  },
  {
    q: "Para que serve a Previsão de diário?",
    a: (
      <>
        Define um valor previsto de gasto diário. O app compara o diário médio real
        com a previsão para sinalizar se você está dentro ou fora da meta.
      </>
    ),
  },
  {
    q: "Como uso as Tags?",
    a: (
      <>
        Tags ajudam a classificar movimentações além da categoria. Crie tags
        próprias em <Link href="/tags" className="text-primary underline">Tags</Link>
        {" "}e marque transações ao registrá-las.
      </>
    ),
  },
  {
    q: "Posso compartilhar minha conta?",
    a: (
      <>
        Sim. Em <Link href="/configuracoes" className="text-primary underline">Configurações</Link>{" "}
        você convida outra pessoa por email. Ela recebe um link e passa a operar a
        mesma base de dados.
      </>
    ),
  },
  {
    q: "Como envio uma sugestão ou reporto um bug?",
    a: (
      <>
        Use a tela de{" "}
        <Link href="/sugestoes" className="text-primary underline">Sugestões</Link>{" "}
        no menu. Sua mensagem chega direto pra equipe.
      </>
    ),
  },
  {
    q: "Meus dados ficam seguros?",
    a: (
      <>
        Sim. Autenticação via Google ou senha, sessões assinadas, dados isolados por
        usuário no banco. Não compartilhamos com terceiros.
      </>
    ),
  },
];

export default function AjudaPage() {
  return (
    <div className="flex flex-col min-h-full bg-canvas pb-24">
      <BackHeader title="Ajuda" />

      <div className="px-4 py-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-ink mb-1">Como podemos ajudar?</h2>
          <p className="text-sm text-ink/80 leading-relaxed">
            Respostas rápidas para as dúvidas mais comuns sobre o app.
          </p>
        </div>

        {/* FAQ */}
        <div className="flex flex-col">
          <p className="text-[11px] font-bold text-ink uppercase tracking-[0.32px] mb-3 px-1">
            Perguntas frequentes
          </p>
          <div className="rounded-xl border border-hairline-soft bg-canvas overflow-hidden">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="group border-b border-hairline-soft last:border-b-0"
              >
                <summary className="flex items-center justify-between gap-3 px-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-base font-medium text-ink">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className="text-muted shrink-0 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="px-4 pb-4 text-sm text-ink/85 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold text-ink uppercase tracking-[0.32px] px-1">
            Não achou o que procurava?
          </p>
          <Link
            href="/sugestoes"
            className="flex items-center gap-3 rounded-xl border border-hairline-soft bg-canvas p-4 hover:border-hairline transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-ink shrink-0">
              <Lightbulb size={20} />
            </span>
            <span className="flex-1">
              <span className="block text-base font-semibold text-ink">Enviar sugestão</span>
              <span className="block text-sm text-ink/80">Ideia, melhoria ou problema</span>
            </span>
          </Link>
          <a
            href="mailto:contato@bfincont.com.br"
            className="flex items-center gap-3 rounded-xl border border-hairline-soft bg-canvas p-4 hover:border-hairline transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-ink shrink-0">
              <Mail size={20} />
            </span>
            <span className="flex-1">
              <span className="block text-base font-semibold text-ink">Falar por email</span>
              <span className="block text-sm text-ink/80">contato@bfincont.com.br</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
