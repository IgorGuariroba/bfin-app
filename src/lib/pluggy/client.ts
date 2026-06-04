import "server-only";

/**
 * Cliente mínimo da API Pluggy (Open Finance).
 * Autentica com clientId/clientSecret → apiKey (válida ~2h), usada no header X-API-KEY.
 * Sem SDK: fetch direto, espelhando o padrão de lib/mercadopago.ts.
 */

const BASE_URL = "https://api.pluggy.ai";

export type PluggyAccount = {
  id: string;
  type: "BANK" | "CREDIT";
  subtype: string;
  name: string;
  itemId: string;
};

export type PluggyTransaction = {
  id: string;
  description: string;
  amount: number; // com sinal: negativo = saída
  date: string; // ISO
  type: "DEBIT" | "CREDIT";
  category?: string | null;
  accountId: string;
};

export type PluggyItem = {
  id: string;
  status: string;
  connector: { name: string };
};

async function getApiKey(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: process.env.PLUGGY_CLIENT_ID,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    throw new Error(`Pluggy /auth failed: ${res.status} ${await res.text()}`);
  }
  const data: { apiKey: string } = await res.json();
  return data.apiKey;
}

async function pluggyGet<T>(apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!res.ok) {
    throw new Error(`Pluggy GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/** Cria um connect token escopado ao usuário, com webhook e dedupe. */
export async function createConnectToken(opts: {
  clientUserId: string;
  webhookUrl: string;
  itemId?: string;
}): Promise<string> {
  const apiKey = await getApiKey();
  const res = await fetch(`${BASE_URL}/connect_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({
      ...(opts.itemId ? { itemId: opts.itemId } : {}),
      options: {
        clientUserId: opts.clientUserId,
        webhookUrl: opts.webhookUrl,
        avoidDuplicates: true,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Pluggy /connect_token failed: ${res.status} ${await res.text()}`);
  }
  const data: { accessToken: string } = await res.json();
  return data.accessToken;
}

export async function getItem(itemId: string): Promise<PluggyItem> {
  const apiKey = await getApiKey();
  return pluggyGet<PluggyItem>(apiKey, `/items/${itemId}`);
}

export async function listAccounts(itemId: string): Promise<PluggyAccount[]> {
  const apiKey = await getApiKey();
  const data = await pluggyGet<{ results: PluggyAccount[] }>(
    apiKey,
    `/accounts?itemId=${itemId}`
  );
  return data.results;
}

/**
 * Lista todas as transactions de uma conta via paginação por cursor.
 * `createdAtFrom` permite buscar só o que foi criado a partir de um instante
 * (usado quando o webhook traz transactionsCreatedAtFrom).
 */
export async function listTransactions(
  accountId: string,
  opts: { createdAtFrom?: string } = {}
): Promise<PluggyTransaction[]> {
  const apiKey = await getApiKey();
  const all: PluggyTransaction[] = [];
  let query = `accountId=${accountId}`;
  if (opts.createdAtFrom) query += `&createdAtFrom=${encodeURIComponent(opts.createdAtFrom)}`;

  let path = `/v2/transactions?${query}`;
  // O campo `next` já vem como query string ("?accountId=...&after=...").
  while (path) {
    const page = await pluggyGet<{ results: PluggyTransaction[]; next: string | null }>(
      apiKey,
      path
    );
    all.push(...page.results);
    path = page.next ? `/v2/transactions${page.next}` : "";
  }
  return all;
}
