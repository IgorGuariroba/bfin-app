"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  status: string;
  userName: string;
  userEmail: string;
  postTitle: string;
  postSlug: string;
};

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function CommentsModeration({ comments }: { comments: Comment[] }) {
  const router = useRouter();

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/blog/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Excluir comentário permanentemente?")) return;
    const res = await fetch(`/api/admin/blog/comments/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  if (comments.length === 0) {
    return <p className="text-body-text text-sm">Nada por aqui.</p>;
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="rounded-[14px] border border-hairline bg-canvas p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="text-sm">
              <div className="font-semibold">{c.userName}</div>
              <div className="text-xs text-body-text">{c.userEmail}</div>
              <div className="text-xs text-body-text">
                em{" "}
                <Link href={`/blog/${c.postSlug}`} target="_blank" className="text-rausch hover:underline">
                  {c.postTitle}
                </Link>{" "}
                · {dateFmt.format(new Date(c.createdAt))}
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              {c.status !== "approved" && (
                <button onClick={() => setStatus(c.id, "approved")} className="h-9 rounded-lg bg-rausch px-3 font-medium text-on-primary hover:bg-rausch-active">
                  Aprovar
                </button>
              )}
              {c.status !== "rejected" && (
                <button onClick={() => setStatus(c.id, "rejected")} className="h-9 rounded-lg border border-ink px-3 font-medium text-ink hover:bg-surface-soft">
                  Rejeitar
                </button>
              )}
              <button onClick={() => remove(c.id)} className="h-9 rounded-lg border border-hairline px-3 font-medium text-error hover:bg-surface-soft">
                Excluir
              </button>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-ink">{c.body}</p>
        </li>
      ))}
    </ul>
  );
}
