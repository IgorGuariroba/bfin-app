export const CAT_COLORS = {
  entrada: "#2db55d", // green
  saida: "#ff385c",   // rausch
  diario: "#92174d",  // plus (magenta)
  cartao: "#460479",  // luxe (purple)
  economia: "#2db55d", // green (same as entrada)
};

export const CAT_LABELS = {
  entrada: "Entrada",
  saida: "Saída",
  diario: "Diário",
  cartao: "Cartão",
  economia: "Guardado",
};

export const TYPE_LABELS_FULL = {
  entrada: "Entradas",
  saida: "Saídas",
  diario: "Gastos Diários",
  cartao: "Cartão de Crédito",
  economia: "Economias",
};

export const CATEGORIES = ["entrada", "saida", "diario", "cartao", "economia"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Tags padrão do sistema — criadas automaticamente para cada usuário e não editáveis */
export const DEFAULT_SYSTEM_TAGS = [
  { name: "Entradas", color: "#2db55d" },
  { name: "Saídas",   color: "#ff385c" },
  { name: "Diários",  color: "#92174d" },
  { name: "Economias", color: "#2db55d" },
] as const;
