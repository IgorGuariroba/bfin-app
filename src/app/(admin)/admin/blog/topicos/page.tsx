import { asc } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { postTopic } from "@/db/schema";
import { countPostsByTopic } from "@/lib/blog-db";
import { TopicsManager } from "@/components/blog/topics-manager";

export default async function AdminTopicsPage() {
  const [topics, postCounts] = await Promise.all([
    db.select().from(postTopic).orderBy(asc(postTopic.name)),
    countPostsByTopic(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Tópicos</h1>
        <p className="mt-1 text-[14px] text-muted">Organize os posts por tema.</p>
      </div>
      <TopicsManager
        initial={topics.map((t) => ({ id: t.id, name: t.name, slug: t.slug, postCount: postCounts.get(t.id) ?? 0 }))}
      />
    </div>
  );
}
