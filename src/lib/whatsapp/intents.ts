import "server-only";
import { billingService } from "@/adapters";

export type IntentId =
  | "price"
  | "how"
  | "signup"
  | "cancel"
  | "lgpd"
  | "support"
  | "human";

export const MENU_ROWS: { id: IntentId; title: string; description?: string }[] = [
  { id: "price", title: "Preços e planos", description: "Quanto custa o Premium" },
  { id: "how", title: "Como funciona", description: "O que dá pra fazer no bfin" },
  { id: "signup", title: "Criar conta", description: "Começar grátis" },
  { id: "cancel", title: "Cancelar assinatura", description: "Como encerrar o plano" },
  { id: "lgpd", title: "Privacidade / LGPD", description: "Como cuidamos dos seus dados" },
  { id: "support", title: "Suporte", description: "Já sou cliente, preciso de ajuda" },
  { id: "human", title: "Falar com humano", description: "Encaminhar pro atendente" },
];

const KEYWORDS: Record<IntentId, string[]> = {
  price: ["preço", "preco", "preços", "precos", "valor", "valores", "plano", "planos", "custa", "custo", "mensal", "anual"],
  how: ["como funciona", "funciona", "o que é", "o que e", "feature", "features", "funcionalidade"],
  signup: ["cadastro", "cadastrar", "criar conta", "signup", "registrar", "registro"],
  cancel: ["cancelar", "cancelamento", "encerrar", "desistir", "sair"],
  lgpd: ["lgpd", "privacidade", "dados", "política", "politica"],
  support: ["suporte", "ajuda", "problema", "erro", "bug", "cliente"],
  human: ["humano", "atendente", "pessoa", "operador"],
};

export function detectIntent(text: string): IntentId | null {
  const normalized = text.toLowerCase().trim();
  for (const [intent, words] of Object.entries(KEYWORDS) as [IntentId, string[]][]) {
    if (words.some((w) => normalized.includes(w))) return intent;
  }
  return null;
}

export function isDeleteKeyword(text: string): boolean {
  return text.trim().toLowerCase() === "apagar";
}

const SITE_URL = "https://bfincont.com.br";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export async function priceText(): Promise<string> {
  // Canal consome o core para dados do domínio financeiro (ADR-0013) — o
  // PlanConfig é a fonte única de preço.
  const prices = await billingService.getPlanPrices();
  return (
    `Temos o plano gratuito + Premium por ${brl.format(prices.monthly)}/mês ` +
    `ou ${brl.format(prices.annual)}/ano.\n\nDetalhes: ${SITE_URL}`
  );
}

export const STATIC_RESPONSES: Record<Exclude<IntentId, "price">, string> = {
  how:
    "O bfin organiza suas finanças pessoais: você lança transações, " +
    `vê saldos, previsões e gráficos.\n\nConheça em ${SITE_URL}`,
  signup: `Criar conta é grátis e leva menos de 1 minuto: ${SITE_URL}\n\nSem cartão de crédito.`,
  cancel:
    "Você pode cancelar a qualquer momento na sua conta. " +
    `Acesse ${SITE_URL} e entre em "Minha conta".`,
  lgpd:
    "Levamos seus dados a sério. Só guardamos o necessário pra atender.\n\n" +
    `Política completa: ${SITE_URL}\n\n` +
    "Para apagar todos os seus dados desta conversa, responda *APAGAR*.",
  support: "Encaminhei sua mensagem para nossa equipe. Em breve um atendente humano responde por aqui.",
  human: "Beleza! Estou chamando um atendente humano. Aguarde só um momento.",
};

export const WELCOME_TEXT =
  "Olá! 👋 Sou o assistente do bfin 💸 Como posso ajudar você hoje?";

export const FALLBACK_TEXT =
  "Não entendi sua mensagem. Vou chamar um atendente humano pra te ajudar.";

export const RATE_LIMITED_TEXT =
  "Detectamos muitas mensagens em pouco tempo. Pausamos o atendimento automático. " +
  "Em breve um humano entra em contato.";

export const DELETE_CONFIRMED_TEXT =
  "Pronto. Apagamos todos os seus dados desta conversa conforme a LGPD. " +
  "Se quiser falar com a gente de novo, é só mandar uma mensagem.";

export type HandoffIntent = Extract<IntentId, "support" | "human">;
export function isHandoffIntent(intent: IntentId): intent is HandoffIntent {
  return intent === "support" || intent === "human";
}
