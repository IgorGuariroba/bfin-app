import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { resolvePrincipal } from "@/lib/mcp-principal";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  suggestTag,
  suggestType,
  TransactionValidationError,
} from "@/lib/transactions-service";
import { fmt } from "@/lib/utils";

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function buildServer(userId: string): McpServer {
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

  const server = buildServer(principal.userId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  await server.connect(transport);

  return transport.handleRequest(request);
}
