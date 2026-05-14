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
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-body-text">Gerenciar posts, tópicos e comentários.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/blog/topicos" className="rounded-md border border-hairline px-3 py-2 text-sm">
            Tópicos
          </Link>
          <Link href="/admin/blog/comentarios" className="rounded-md border border-hairline px-3 py-2 text-sm">
            Comentários
          </Link>
          <Link href="/admin/blog/novo" className="rounded-md bg-ink px-3 py-2 text-sm text-canvas">
            Novo post
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-body-text">Nenhum post ainda.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase text-body-text">
              <th className="py-2">Título</th>
              <th>Categoria</th>
              <th>Status</th>
              <th>Autor</th>
              <th>Atualizado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-hairline-soft">
                <td className="py-3 font-medium">{p.title}</td>
                <td>{p.category}</td>
                <td>{STATUS_LABEL[p.status] ?? p.status}</td>
                <td>{p.author.name}</td>
                <td>{dateFmt.format(p.updatedAt)}</td>
                <td className="text-right">
                  <Link href={`/admin/blog/${p.id}/editar`} className="text-rausch hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
