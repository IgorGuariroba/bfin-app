import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { resolvePrincipal } from "@/lib/mcp-principal";
import { checkRateLimit, classifyRpc, RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listTransactions,
  suggestTag,
  suggestType,
  TransactionValidationError,
} from "@/lib/transactions-service";
import { createTag, listTags, TagValidationError } from "@/lib/tags-service";
import { recordAgentWrite } from "@/lib/agent-audit";
import {
  getMonthSummary,
  getSaldos,
  getSugestoes,
  getTotais,
  InsightsValidationError,
} from "@/lib/insights-service";
import { fmt } from "@/lib/utils";

/** Empacota um resultado de leitura como conteúdo JSON para o agente consumir. */
function jsonContent(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

/**
 * Executa uma leitura e empacota o resultado como JSON. Erros de validação
 * (mês/data inválidos) viram tool error estruturado (isError) — espelha o
 * tratamento de create_transaction, em vez de propagar erro JSON-RPC genérico.
 */
async function readContent(produce: () => Promise<unknown>) {
  try {
    return jsonContent(await produce());
  } catch (error) {
    if (
      error instanceof InsightsValidationError ||
      error instanceof TransactionValidationError
    ) {
      return { isError: true, content: [{ type: "text" as const, text: error.message }] };
    }
    throw error;
  }
}

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês no formato YYYY-MM")
  .describe("Mês no formato YYYY-MM (ex.: 2026-06).");

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function buildServer(userId: string, apiKeyId: string): McpServer {
  const server = new McpServer({ name: "bfin-assistente", version: "1.0.0" });

  server.registerTool(
    "create_transaction",
    {
      description:
        "Registra uma movimentação financeira (Transaction) na conta do usuário.",
      inputSchema: {
        description: z.string().describe("Descrição da movimentação"),
        amount: z.number().positive().describe("Valor, sempre positivo"),
        date: z.string().describe("Data no formato YYYY-MM-DD"),
        type: z
          .enum(["entrada", "saida", "cartao", "economia"])
          .optional()
          .describe(
            "Tipo da movimentação. Se omitido, é inferido da descrição (gasto → 'saida', receita → 'entrada'). " +
              "Gasto real (mercado, uber, etc.) é 'saida'. 'diario' não é permitido — é reservado à projeção da Previsão."
          ),
        force: z
          .boolean()
          .optional()
          .describe("Força a criação mesmo quando houver uma transação duplicata suspeita."),
        repeat: z
          .enum(["daily", "weekly", "monthly"])
          .optional()
          .describe("Recorrência: 'daily', 'weekly' ou 'monthly'. Omitido = não repete."),
        repeatEnd: z
          .enum(["forever", "count"])
          .optional()
          .describe(
            "Fim da recorrência: 'forever' (12 ocorrências) ou 'count' (use repeatCount). Só vale com repeat."
          ),
        repeatCount: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Número de ocorrências quando repeatEnd='count'."),
      },
    },
    async ({ description, amount, date, type, force, repeat, repeatEnd, repeatCount }) => {
      try {
        const resolvedType = type ?? suggestType(description);
        // Sugere uma Tag existente do usuário a partir da descrição (ADR-0004).
        const userTags = await prisma.tag.findMany({
          where: { userId },
          select: { id: true, name: true },
        });
        const suggestedTagId = suggestTag(description, userTags);
        const result = await createTransaction({
          userId,
          type: resolvedType,
          description,
          amount,
          date,
          source: "agent",
          force,
          repeat,
          repeatEnd,
          repeatCount,
          tagIds: suggestedTagId ? [suggestedTagId] : undefined,
        });
        if (result.duplicated) {
          const dup = result.transaction;
          return {
            content: [
              {
                type: "text",
                text: `Possível duplicata: já existe "${dup.description}" (${dup.type}) ${fmt(dup.amount)}. Envie force=true para criar mesmo assim.`,
              },
            ],
          };
        }
        const tx = result.transaction;
        await recordAgentWrite({ apiKeyId, userId, action: "create", entityId: tx.id });
        const tagName = tx.tags[0]?.name;
        const recurrenceNote =
          repeat && repeatEnd === "count" && repeatCount
            ? ` Recorrência ${repeat} (${repeatCount}x).`
            : repeat
              ? ` Recorrência ${repeat}.`
              : "";
        const tagNote = tagName ? ` Tag: ${tagName}.` : "";
        return {
          content: [
            {
              type: "text",
              text: `Movimentação criada: ${tx.description} (${tx.type}) ${fmt(tx.amount)} em ${date}.${tagNote}${recurrenceNote}`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof TransactionValidationError) {
          return {
            isError: true,
            content: [{ type: "text", text: error.message }],
          };
        }
        throw error;
      }
    }
  );

  server.registerTool(
    "get_month_summary",
    {
      description:
        "Resumo do mês em uma chamada: entradas, custo de vida, quanto sobrou (sobrouNoMes) e saldo. Use para responder 'quanto sobrou este mês'.",
      inputSchema: { month: monthSchema },
    },
    async ({ month }) => readContent(() => getMonthSummary(userId, month))
  );

  server.registerTool(
    "get_totais",
    {
      description:
        "Totais detalhados do mês por tipo (entrada/saida/cartao/diario/economia), custo de vida, performance, saldo e comparação com o mês anterior.",
      inputSchema: { month: monthSchema },
    },
    async ({ month }) => readContent(() => getTotais(userId, month))
  );

  server.registerTool(
    "get_saldos",
    {
      description:
        "Evolução do saldo acumulado dia a dia no mês (para mostrar como o saldo varia ao longo do mês).",
      inputSchema: { month: monthSchema },
    },
    async ({ month }) => readContent(() => getSaldos(userId, month))
  );

  server.registerTool(
    "get_sugestoes",
    {
      description:
        "Insights financeiros proativos do mês (saldo negativo, gasto diário acima da Previsão, economia baixa, custo de vida em alta). Lista vazia = nada a sinalizar.",
      inputSchema: { month: monthSchema },
    },
    async ({ month }) => readContent(() => getSugestoes(userId, month))
  );

  server.registerTool(
    "list_transactions",
    {
      description:
        "Lista movimentações com filtros, para responder perguntas como 'quanto gastei com mercado'. Filtre por mês, tipo e/ou Tag.",
      inputSchema: {
        month: monthSchema.optional(),
        type: z
          .enum(["entrada", "saida", "diario", "cartao", "economia"])
          .optional()
          .describe(
            "Filtra por tipo da movimentação. 'diario' é a projeção de gasto variável da Previsão (não gasto real)."
          ),
        tagId: z.string().optional().describe("Filtra pelas movimentações com esta Tag."),
      },
    },
    async ({ month, type, tagId }) =>
      readContent(() => listTransactions(userId, { month, type, tagId }))
  );

  server.registerTool(
    "update_transaction",
    {
      description:
        "Edita uma movimentação existente, identificada pelo seu id (alvo explícito). " +
        "Envie só os campos a corrigir; os demais ficam intactos.",
      inputSchema: {
        id: z.string().describe("Identificador da movimentação a editar."),
        description: z.string().optional().describe("Nova descrição."),
        amount: z.number().positive().optional().describe("Novo valor, sempre positivo."),
        date: z.string().optional().describe("Nova data no formato YYYY-MM-DD."),
        type: z
          .enum(["entrada", "saida", "cartao", "economia"])
          .optional()
          .describe(
            "Novo tipo. 'diario' não é permitido — é reservado à projeção da Previsão."
          ),
        tagIds: z
          .array(z.string())
          .optional()
          .describe("Substitui o conjunto de Tags (lista vazia remove todas)."),
      },
    },
    async ({ id, description, amount, date, type, tagIds }) => {
      try {
        const tx = await updateTransaction({
          userId,
          id,
          description,
          amount,
          date,
          type,
          tagIds,
        });
        await recordAgentWrite({ apiKeyId, userId, action: "update", entityId: tx.id });
        return {
          content: [
            {
              type: "text",
              text: `Movimentação atualizada: ${tx.description} (${tx.type}) ${fmt(tx.amount)}.`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof TransactionValidationError) {
          return { isError: true, content: [{ type: "text", text: error.message }] };
        }
        throw error;
      }
    }
  );

  server.registerTool(
    "delete_transaction",
    {
      description:
        "Remove permanentemente uma movimentação pelo seu id (irreversível). " +
        "Use para apagar um lançamento errado.",
      inputSchema: {
        id: z.string().describe("Identificador da movimentação a remover."),
      },
    },
    async ({ id }) => {
      try {
        await deleteTransaction(userId, id);
        await recordAgentWrite({ apiKeyId, userId, action: "delete", entityId: id });
        return {
          content: [{ type: "text", text: `Movimentação ${id} removida.` }],
        };
      } catch (error) {
        if (error instanceof TransactionValidationError) {
          return { isError: true, content: [{ type: "text", text: error.message }] };
        }
        throw error;
      }
    }
  );

  server.registerTool(
    "create_tag",
    {
      description:
        "Cria uma Tag (categoria) na conta do usuário, para classificar movimentações. " +
        "O nome é único por usuário.",
      inputSchema: {
        name: z.string().describe("Nome da Tag (ex.: 'Viagem'). Único por usuário."),
        color: z
          .string()
          .optional()
          .describe("Cor em hex (ex.: '#4a90e2'). Se omitida, usa uma cor neutra."),
      },
    },
    async ({ name, color }) => {
      try {
        const tag = await createTag({ userId, name, color });
        await recordAgentWrite({ apiKeyId, userId, action: "create", entityId: tag.id });
        return {
          content: [{ type: "text", text: `Tag criada: ${tag.name}.` }],
        };
      } catch (error) {
        if (error instanceof TagValidationError) {
          return { isError: true, content: [{ type: "text", text: error.message }] };
        }
        throw error;
      }
    }
  );

  server.registerTool(
    "list_tag",
    {
      description:
        "Lista as Tags (categorias) do usuário, para escolher um filtro ou descobrir a taxonomia disponível.",
      inputSchema: {},
    },
    async () => readContent(() => listTags(userId))
  );

  server.registerTool(
    "get_previsao",
    {
      description:
        "Retorna a Previsão configurada do usuário (itens de gasto previsto, somente leitura). " +
        "Não aplica nem altera nada.",
      inputSchema: {},
    },
    async () =>
      readContent(() =>
        prisma.previsao.findMany({ where: { userId }, orderBy: { name: "asc" } })
      )
  );

  return server;
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const principal = await resolvePrincipal(token);
  if (!principal) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit por ApiKey, separado por leitura/escrita (ADR-0004). Consome o
  // body para classificar a chamada; como o stream só pode ser lido uma vez,
  // reconstrói o Request para o transport.
  const rawBody = await request.text();
  const kind = classifyRpc(rawBody);
  const limit = checkRateLimit(`${principal.apiKeyId}:${kind}`, RATE_LIMITS[kind]);
  if (!limit.allowed) {
    return Response.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } }
    );
  }
  // Reaproveita os headers originais, mas descarta os que descrevem o corpo na
  // forma em que ele chegou (comprimido/chunked): `rawBody` já é texto plano e o
  // content-length é recalculado a partir dele. Mantê-los faria o transport
  // tentar descomprimir um corpo plano ou truncar o JSON pelo tamanho antigo.
  const headers = new Headers(request.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  const forwarded = new Request(request.url, {
    method: request.method,
    headers,
    body: rawBody,
  });

  const server = buildServer(principal.userId, principal.apiKeyId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  await server.connect(transport);

  return transport.handleRequest(forwarded);
}
