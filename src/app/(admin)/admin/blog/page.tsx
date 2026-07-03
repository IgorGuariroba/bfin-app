import Link from "next/link";
import { Plus } from "lucide-react";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { post, postComment, user } from "@/db/schema";
import { fromDbTimestamp } from "@/adapters/drizzle/timestamp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  published: "default",
  archived: "secondary",
};

export default async function AdminBlogPage() {
  const [rows, [{ n: pendingComments }]] = await Promise.all([
    db
      .select({
        id: post.id,
        title: post.title,
        category: post.category,
        status: post.status,
        updatedAt: post.updatedAt,
        authorName: user.name,
      })
      .from(post)
      .innerJoin(user, eq(post.authorId, user.id))
      .orderBy(desc(post.updatedAt)),
    db.select({ n: count() }).from(postComment).where(eq(postComment.status, "pending")),
  ]);
  const posts = rows.map((p) => ({
    ...p,
    updatedAt: fromDbTimestamp(p.updatedAt),
    author: { name: p.authorName },
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Blog</h1>
          <p className="mt-1 text-[14px] text-muted">Posts, tópicos e comentários.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/blog/topicos">Tópicos</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/blog/comentarios">
              Comentários
              {pendingComments > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">{pendingComments}</Badge>
              )}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/blog/novo">
              <Plus size={16} />
              Novo post
            </Link>
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="rounded-[14px]">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-body-text">Nenhum post ainda.</p>
            <Button asChild>
              <Link href="/admin/blog/novo">Criar primeiro post</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[14px] overflow-hidden py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-body-text">{p.category}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-body-text">{p.author.name}</TableCell>
                    <TableCell className="text-body-text">{dateFmt.format(p.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/blog/${p.id}/editar`}>Editar</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
