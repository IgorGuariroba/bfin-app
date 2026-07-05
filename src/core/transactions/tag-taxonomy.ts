// Cópia congelada de CATEGORY_TAGS (dono agora é o bfin-backend, ADR-0017 #182).
// suggestTag precisa dos keywords pra sugerir Tag por categoria; o agregado
// Transactions ainda não migrou (#183), então esta cópia fica até lá — não
// editar aqui, mudança de taxonomia é PR no bfin-backend primeiro.
export const CATEGORY_TAGS = [
  {
    name: "Alimentação",
    color: "#f5a623",
    keywords: ["mercado", "supermercado", "ifood", "restaurante", "lanche", "padaria", "comida", "almoco", "jantar"],
  },
  {
    name: "Transporte",
    color: "#4a90e2",
    keywords: ["uber", "99", "taxi", "gasolina", "combustivel", "onibus", "metro", "passagem", "estacionamento"],
  },
  {
    name: "Moradia",
    color: "#7b6ef6",
    keywords: ["aluguel", "condominio", "luz", "agua", "internet", "iptu", "faxina"],
  },
  {
    name: "Lazer",
    color: "#460479",
    keywords: ["cinema", "bar", "show", "viagem", "netflix", "spotify", "streaming", "jogo", "festa"],
  },
  {
    name: "Saúde",
    color: "#50c878",
    keywords: ["farmacia", "remedio", "medico", "consulta", "exame", "academia", "dentista"],
  },
] as const;
