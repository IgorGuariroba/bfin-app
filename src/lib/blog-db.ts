import "server-only";
import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { postTopic, postTopics } from "@/db/schema";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type PostTopicRef = { id: string; name: string; slug: string };

/**
 * Busca os tópicos de um lote de posts numa única query (join na tabela de
 * junção implícita `_PostTopics`) — substitui o `include: { topics }` do
 * Prisma, que não existe em Drizzle (ADR-0013: blog fica fora do core, mas o
 * padrão de batch-join segue o mesmo de adapters/drizzle/transaction-repo.ts).
 */
export async function attachTopics<T extends { id: string }>(
  posts: T[]
): Promise<(T & { topics: PostTopicRef[] })[]> {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);
  const rows = await db
    .select({ postId: postTopics.a, id: postTopic.id, name: postTopic.name, slug: postTopic.slug })
    .from(postTopics)
    .innerJoin(postTopic, eq(postTopic.id, postTopics.b))
    .where(inArray(postTopics.a, ids));

  const byPost = new Map<string, PostTopicRef[]>();
  for (const r of rows) {
    const list = byPost.get(r.postId) ?? [];
    list.push({ id: r.id, name: r.name, slug: r.slug });
    byPost.set(r.postId, list);
  }
  return posts.map((p) => ({ ...p, topics: byPost.get(p.id) ?? [] }));
}

/**
 * Substitui o conjunto de tópicos de um post pelo informado — equivalente ao
 * `topics: { set }` (update) ou `topics: { connect }` (create, post ainda sem
 * linhas na junção) do Prisma.
 */
export async function setPostTopics(
  client: DbOrTx,
  postId: string,
  topicIds: string[]
): Promise<void> {
  await client.delete(postTopics).where(eq(postTopics.a, postId));
  if (topicIds.length > 0) {
    await client.insert(postTopics).values(topicIds.map((topicId) => ({ a: postId, b: topicId })));
  }
}

/** Conta posts por tópico numa única query — equivalente ao `_count.select.posts` do Prisma. */
export async function countPostsByTopic(): Promise<Map<string, number>> {
  const rows = await db
    .select({ topicId: postTopics.b, n: count() })
    .from(postTopics)
    .groupBy(postTopics.b);
  return new Map(rows.map((r) => [r.topicId, r.n]));
}
