import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export default async function AdminBlogPage() {
  if (!(await requireBlogAdmin())) redirect("/saldos");

  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Blog</h1>
          <p className="mt-1 text-sm text-body-text">Gerenciar posts, tópicos e comentários.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/blog/topicos" className="inline-flex h-10 items-center rounded-lg border border-hairline bg-canvas px-4 text-sm font-medium text-ink hover:bg-surface-soft">
            Tópicos
          </Link>
          <Link href="/admin/blog/comentarios" className="inline-flex h-10 items-center rounded-lg border border-hairline bg-canvas px-4 text-sm font-medium text-ink hover:bg-surface-soft">
            Comentários
          </Link>
          <Link href="/admin/blog/novo" className="inline-flex h-10 items-center rounded-lg bg-rausch px-4 text-sm font-medium text-on-primary hover:bg-rausch-active">
            Novo post
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-surface-soft p-10 text-center">
          <p className="text-body-text">Nenhum post ainda.</p>
          <Link href="/admin/blog/novo" className="mt-4 inline-flex h-10 items-center rounded-lg bg-rausch px-4 text-sm font-medium text-on-primary hover:bg-rausch-active">
            Criar primeiro post
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
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
                    <span className="inline-flex items-center rounded-full border border-hairline bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink">
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 text-body-text">{p.author.name}</td>
                  <td className="px-4 text-body-text">{dateFmt.format(p.updatedAt)}</td>
                  <td className="px-4 text-right">
                    <Link href={`/admin/blog/${p.id}/editar`} className="font-medium text-rausch hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
