import "server-only";

import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths } from "@/lib/date-utils";
import { CATEGORY_TAGS } from "@/lib/constants";

type Transaction = Awaited<ReturnType<typeof prisma.transaction.create>>;

// createTransaction sempre retorna a transação com suas tags (include fixo abaixo).
type TransactionWithTags = Transaction & {
  tags: { id: string; name: string; color: string }[];
};

export class TransactionValidationError extends Error {}

const VALID_TYPES = ["entrada", "saida", "diario", "cartao", "economia"];

// Sinais de receita para suggestType. Lista conservadora: o default é gasto → "saida".
// "diario" jamais é sugerido (é projeção — ADR-0004).
const INCOME_KEYWORDS = [
  "salário",
  "salario",
  "recebi",
  "rendimento",
  "depósito",
  "deposito",
  "reembolso",
];

/** Sugere type a partir da descrição: receita → "entrada", resto → "saida" (nunca "diario"). */
export function suggestType(description: string): "entrada" | "saida" {
  const d = (description ?? "").toLowerCase();
  return INCOME_KEYWORDS.some((k) => d.includes(k)) ? "entrada" : "saida";
}

/** Minúsculas + remove acentos, para casar descrição × nome de Tag sem sensibilidade a diacríticos. */
function normalize(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Sugere o id de uma Tag do usuário a partir da descrição. Retorna null se nada casar.
 * Heurística conservadora (ADR-0004): primeiro tenta o nome da própria Tag na descrição,
 * depois um sinônimo de categoria (taxonomia canônica em CATEGORY_TAGS — #93). Nunca inventa
 * Tag — só aponta para uma existente (as categorias são semeadas por ensureSystemTags).
 */
export function suggestTag(
  description: string,
  tags: { id: string; name: string }[]
): string | null {
  const d = normalize(description);
  if (!d) return null;

  // 1) Nome da Tag aparece na descrição (ex.: "Academia" em "academia mensal").
  for (const tag of tags) {
    const n = normalize(tag.name);
    if (n && d.includes(n)) return tag.id;
  }

  // 2) Palavra-chave de categoria → Tag cujo nome case com a categoria.
  for (const cat of CATEGORY_TAGS) {
    if (cat.keywords.some((k) => d.includes(k))) {
      const target = normalize(cat.name);
      const tag = tags.find((t) => normalize(t.name).includes(target));
      if (tag) return tag.id;
    }
  }
  return null;
}

export interface ListTransactionsFilter {
  month?: string; // YYYY-MM — atalho para o intervalo do mês inteiro
  type?: string;
  tagId?: string;
  from?: string; // YYYY-MM-DD (ignorado se month presente)
  to?: string; // YYYY-MM-DD (ignorado se month presente)
}

/**
 * Parseia um limite YYYY-MM-DD do filtro, rejeitando formato/datas impossíveis
 * (round-trip) com TransactionValidationError — evita Invalid Date chegando ao
 * Prisma como 500. endOfDay=true fixa o fim do dia (limite superior inclusivo).
 */
function parseFilterDay(s: string, endOfDay = false): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new TransactionValidationError("Invalid date format. Expected YYYY-MM-DD");
  }
  const [y, m, d] = s.split("-").map(Number);
  const date = endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    throw new TransactionValidationError("Invalid date");
  }
  return date;
}

/**
 * Lista as Transactions do usuário aplicando filtros (mês/type/Tag ou intervalo
 * from/to). Sempre escopado ao próprio userId (anti-IDOR). Extraído de
 * GET /api/transactions para ser reutilizado por REST e MCP.
 */
export async function listTransactions(
  userId: string,
  filter: ListTransactionsFilter = {}
): Promise<TransactionWithTags[]> {
  const { month, type, tagId, from, to } = filter;
  const where: Record<string, unknown> = { userId };

  if (month) {
    // Valida antes de instanciar Date: um month malformado viraria Invalid Date
    // e o Prisma estouraria PrismaClientValidationError (500) no findMany.
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new TransactionValidationError("Invalid month format. Expected YYYY-MM");
    }
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    where.date = { gte: start, lt: end };
  } else if (from || to) {
    where.date = {
      ...(from ? { gte: parseFilterDay(from) } : {}),
      ...(to ? { lte: parseFilterDay(to, true) } : {}),
    };
  }

  if (type) where.type = type;
  if (tagId) where.tags = { some: { id: tagId } };

  return prisma.transaction.findMany({
    where,
    include: { tags: { select: { id: true, name: true, color: true } } },
    orderBy: { date: "asc" },
  });
}

export interface CreateTransactionInput {
  userId: string;
  type: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  source?: "manual" | "agent";
  repeat?: string;
  repeatEnd?: string;
  repeatCount?: number;
  tagIds?: string[];
  force?: boolean; // true = cria mesmo havendo candidata duplicata (ADR-0004)
}

export interface CreateTransactionResult {
  transaction: TransactionWithTags; // criada OU candidata duplicata existente (com tags)
  duplicated: boolean; // true = retornou candidata em vez de criar
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<CreateTransactionResult> {
  const { userId, type, description, amount, source = "manual" } = input;

  if (
    !type ||
    !description ||
    amount == null ||
    typeof input.date !== "string" ||
    !input.date
  ) {
    throw new TransactionValidationError("Missing required fields");
  }
  if (!VALID_TYPES.includes(type)) {
    throw new TransactionValidationError("Invalid type");
  }
  if (typeof amount !== "number" || amount <= 0) {
    throw new TransactionValidationError("amount must be positive number");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new TransactionValidationError("Invalid date format. Expected YYYY-MM-DD");
  }
  const [dy, dm, dd] = input.date.split("-").map(Number);
  const baseDate = new Date(dy, dm - 1, dd, 12, 0, 0);
  // Round-trip: rejeita datas impossíveis que o JS "rola" (ex.: 2026-13-45).
  if (
    baseDate.getFullYear() !== dy ||
    baseDate.getMonth() !== dm - 1 ||
    baseDate.getDate() !== dd
  ) {
    throw new TransactionValidationError("Invalid date");
  }

  // Anti-IDOR (styleguide §39): só conecta tags que pertencem ao próprio userId.
  // Sem isso, um caller poderia anexar a Tag de outro usuário (input do body é cru).
  // Deduplica antes de validar: IDs repetidos fariam o count divergir do length.
  const tagIds = input.tagIds?.length ? [...new Set(input.tagIds)] : undefined;
  if (tagIds?.length) {
    const owned = await prisma.tag.count({
      where: { userId, id: { in: tagIds } },
    });
    if (owned !== tagIds.length) {
      throw new TransactionValidationError("Invalid tags");
    }
  }

  // Dedup defensivo (ADR-0004): candidata = mesmo amount + data ±2 dias + mesmo type,
  // cruzando qualquer origem (agent × pluggy × manual). Sem force, retorna a existente.
  if (!input.force) {
    const candidate = await prisma.transaction.findFirst({
      where: {
        userId,
        type,
        amount,
        date: { gte: addDays(baseDate, -2), lte: addDays(baseDate, 2) },
      },
      include: { tags: { select: { id: true, name: true, color: true } } },
      orderBy: { date: "asc" },
    });
    if (candidate) {
      return { transaction: candidate, duplicated: true };
    }
  }

  const repeat = input.repeat ?? "none";
  const repeatEnd = input.repeatEnd ?? "forever";
  const repeatCount = input.repeatCount ?? 0;

  const connectTags = tagIds?.length
    ? { connect: tagIds.map((id) => ({ id })) }
    : undefined;

  const base = await prisma.transaction.create({
    data: {
      userId,
      type,
      description,
      amount,
      date: baseDate,
      source,
      repeat,
      repeatEnd,
      repeatCount,
      tags: connectTags,
    },
    include: { tags: { select: { id: true, name: true, color: true } } },
  });

  if (repeat !== "none") {
    const extras = buildRepeatDates(baseDate, repeat, repeatEnd, repeatCount);
    const createdExtras = await prisma.transaction.createManyAndReturn({
      data: extras.map((d) => ({
        userId,
        type,
        description,
        amount,
        date: d,
        source,
        repeat,
        repeatEnd,
        repeatCount,
      })),
      select: { id: true },
    });
    if (connectTags && createdExtras.length > 0) {
      await Promise.all(
        createdExtras.map((t) =>
          prisma.transaction.update({
            where: { id: t.id },
            data: { tags: connectTags },
          })
        )
      );
    }
  }

  return { transaction: base, duplicated: false };
}

function buildRepeatDates(
  base: Date,
  repeat: string,
  repeatEnd: string,
  count: number
): Date[] {
  const dates: Date[] = [];
  const maxOccurrences = repeatEnd === "count" ? count - 1 : 12;
  const advance = repeat === "daily" ? addDays : repeat === "weekly" ? addWeeks : addMonths;

  for (let i = 1; i <= maxOccurrences; i++) {
    dates.push(advance(base, i));
  }
  return dates;
}
