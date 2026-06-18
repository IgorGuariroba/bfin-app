import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { resolvePrincipal } from "@/lib/mcp-principal";
import {
  createTransaction,
  TransactionValidationError,
} from "@/lib/transactions-service";

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
          .describe(
            "Tipo da movimentação. Gasto real (mercado, uber, etc.) é 'saida'. " +
              "'diario' não é permitido — é reservado à projeção da Previsão."
          ),
      },
    },
    async ({ description, amount, date, type }) => {
      try {
        const tx = await createTransaction({
          userId,
          type,
          description,
          amount,
          date,
          source: "agent",
        });
        return {
          content: [
            {
              type: "text",
              text: `Movimentação criada: ${tx.description} (${tx.type}) R$ ${tx.amount} em ${date}.`,
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
