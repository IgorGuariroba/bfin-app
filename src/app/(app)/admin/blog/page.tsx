import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AdminBackLink } from "@/components/admin/admin-back-link";

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
  if (!(await requireBlogAdmin())) redirect("/saldos");

  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-24 md:px-6">
      <AdminBackLink />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Blog</h1>
          <p className="mt-1 text-[14px] text-muted">Posts, tópicos e comentários.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/blog/topicos">Tópicos</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/blog/comentarios">Comentários</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/blog/novo">Novo post</Link>
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="rounded-[14px]">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-body-text">Nenhum post ainda.</p>
            <Button asChild>
              <Link href="/admin/blog/novo">Criar primeiro post</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[14px] overflow-hidden py-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3">Título</th>
                    <th className="px-4">Categoria</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Autor</th>
                    <th className="px-4">Atualizado</th>
                    <th className="px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b border-hairline-soft text-ink last:border-b-0 hover:bg-surface-soft">
                      <td className="px-4 py-3 font-medium">{p.title}</td>
                      <td className="px-4 text-body-text">{p.category}</td>
                      <td className="px-4">
                        <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>
                          {STATUS_LABEL[p.status] ?? p.status}
                        </Badge>
                      </td>
                      <td className="px-4 text-body-text">{p.author.name}</td>
                      <td className="px-4 text-body-text">{dateFmt.format(p.updatedAt)}</td>
                      <td className="px-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/blog/${p.id}/editar`}>Editar</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
