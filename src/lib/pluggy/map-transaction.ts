import type { PluggyAccount, PluggyTransaction } from "./client";

/**
 * Converte uma transaction do Pluggy + o tipo da conta no formato do domínio bfin.
 *
 * Regras (decididas no design):
 * - amount é sempre positivo; o sinal vira `type`.
 * - Conta CREDIT (cartão) → "cartao".
 * - Conta BANK, entrada (CREDIT) → "entrada".
 * - Conta BANK, saída (DEBIT) → "saida".
 * - NUNCA mapeia para "diario": diário é conceito de previsão orientativa manual,
 *   e previsao/aplicar é destrutivo sobre type=diario. Importado fica como saida;
 *   o usuário reclassifica se quiser.
 */
export function mapPluggyTransaction(
  tx: PluggyTransaction,
  account: PluggyAccount
): {
  type: "entrada" | "saida" | "cartao";
  description: string;
  amount: number;
  date: Date;
  category: string | null;
} {
  let type: "entrada" | "saida" | "cartao";
  if (account.type === "CREDIT") {
    type = "cartao";
  } else if (tx.type === "CREDIT") {
    type = "entrada";
  } else {
    type = "saida";
  }

  return {
    type,
    description: tx.description?.trim() || "Sem descrição",
    amount: Math.abs(tx.amount),
    date: new Date(tx.date),
    category: tx.category ?? null,
  };
}
