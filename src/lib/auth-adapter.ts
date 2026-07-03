import "server-only";

import { and, eq } from "drizzle-orm";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { db } from "@/lib/drizzle";
import { account, user } from "@/db/schema";
import { fromDbTimestampOrNull, toDbTimestamp } from "@/adapters/drizzle/timestamp";

/**
 * Adapter do NextAuth escrito à mão (não @auth/drizzle-adapter): a lib
 * assume schema próprio com colunas snake_case (refresh_token, expires_at...)
 * e sessão/timestamp em mode 'date', incompatível com nosso schema
 * introspectado do Prisma (camelCase, timestamp mode 'string', ver
 * adapters/drizzle/timestamp.ts). Cobre só os métodos que o NextAuth chama
 * de fato nesta config: strategy "jwt" (sessão não passa pelo banco) e sem
 * provider de Email (sem verification token) — Session/VerificationToken
 * ficam de fora.
 */
function toAdapterUser(row: typeof user.$inferSelect): AdapterUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    emailVerified: fromDbTimestampOrNull(row.emailVerified),
  };
}

export function buildAuthAdapter(): Adapter {
  return {
    async createUser(data: AdapterUser) {
      const [row] = await db
        .insert(user)
        .values({
          id: data.id,
          name: data.name ?? "",
          email: data.email,
          image: data.image,
          emailVerified: data.emailVerified ? toDbTimestamp(data.emailVerified) : null,
        })
        .returning();
      return toAdapterUser(row);
    },
    async getUser(id: string) {
      const [row] = await db.select().from(user).where(eq(user.id, id));
      return row ? toAdapterUser(row) : null;
    },
    async getUserByEmail(email: string) {
      const [row] = await db.select().from(user).where(eq(user.email, email));
      return row ? toAdapterUser(row) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const [row] = await db
        .select({ user })
        .from(account)
        .innerJoin(user, eq(account.userId, user.id))
        .where(
          and(eq(account.provider, provider), eq(account.providerAccountId, providerAccountId))
        );
      return row ? toAdapterUser(row.user) : null;
    },
    async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
      const values: Partial<typeof user.$inferInsert> = {};
      if (data.name !== undefined) values.name = data.name ?? "";
      if (data.email !== undefined) values.email = data.email;
      if (data.image !== undefined) values.image = data.image;
      if (data.emailVerified !== undefined) {
        values.emailVerified = data.emailVerified ? toDbTimestamp(data.emailVerified) : null;
      }
      const [row] = await db.update(user).set(values).where(eq(user.id, data.id)).returning();
      return toAdapterUser(row);
    },
    async linkAccount(data: AdapterAccount) {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refreshToken: data.refresh_token as string | undefined,
        accessToken: data.access_token as string | undefined,
        expiresAt: data.expires_at as number | undefined,
        tokenType: data.token_type as string | undefined,
        scope: data.scope as string | undefined,
        idToken: data.id_token as string | undefined,
        sessionState: data.session_state as string | undefined,
      });
    },
  };
}
