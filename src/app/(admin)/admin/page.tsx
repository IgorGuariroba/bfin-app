import Link from "next/link";
import { FileText, MessageCircle, Users, DollarSign, AlertTriangle, MessagesSquare } from "lucide-react";
import { count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { planConfig, post, postComment, user, whatsappContact, whatsappConversation } from "@/db/schema";
import { fromDbTimestamp } from "@/adapters/drizzle/timestamp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/admin/kpi-card";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminDashboardPage() {
  const [
    [{ n: totalUsers }],
    [{ n: proUsers }],
    [{ n: publishedPosts }],
    [{ n: draftPosts }],
    [{ n: pendingComments }],
    [{ n: waitingWhatsapp }],
    [{ n: activeWhatsapp }],
    [planConfigRow],
    recentPostRows,
    recentConversationRows,
  ] = await Promise.all([
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(user).where(eq(user.plan, "pro")),
    db.select({ n: count() }).from(post).where(eq(post.status, "published")),
    db.select({ n: count() }).from(post).where(eq(post.status, "draft")),
    db.select({ n: count() }).from(postComment).where(eq(postComment.status, "pending")),
    db.select({ n: count() }).from(whatsappConversation).where(eq(whatsappConversation.status, "waiting_human")),
    db
      .select({ n: count() })
      .from(whatsappConversation)
      .where(inArray(whatsappConversation.status, ["bot", "human", "waiting_human"])),
    db.select().from(planConfig).limit(1).catch(() => [null]),
    db
      .select({ id: post.id, title: post.title, status: post.status, updatedAt: post.updatedAt })
      .from(post)
      .orderBy(desc(post.updatedAt))
      .limit(5),
    db
      .select({
        id: whatsappConversation.id,
        status: whatsappConversation.status,
        lastMessageAt: whatsappConversation.lastMessageAt,
        contactName: whatsappContact.name,
        contactPhone: whatsappContact.phone,
      })
      .from(whatsappConversation)
      .innerJoin(whatsappContact, eq(whatsappConversation.contactId, whatsappContact.id))
      .orderBy(desc(whatsappConversation.lastMessageAt))
      .limit(5),
  ]);

  const recentPosts = recentPostRows.map((p) => ({ ...p, updatedAt: fromDbTimestamp(p.updatedAt) }));
  const recentConversations = recentConversationRows.map((c) => ({
    ...c,
    lastMessageAt: fromDbTimestamp(c.lastMessageAt),
    contact: { name: c.contactName, phone: c.contactPhone },
  }));

  const mrr = planConfigRow ? proUsers * planConfigRow.monthlyAmount : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Dashboard</h1>
        <p className="mt-1 text-[14px] text-muted">Visão geral da operação.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Usuários" value={totalUsers} hint={`${proUsers} no Pro`} icon={Users} />
        <KpiCard label="MRR estimada" value={brl.format(mrr)} hint={`${proUsers} assinantes`} icon={DollarSign} tone="success" />
        <KpiCard label="Posts publicados" value={publishedPosts} hint={`${draftPosts} rascunhos`} icon={FileText} />
        <KpiCard label="Comentários" value={pendingComments} hint="pendentes" icon={MessagesSquare} tone={pendingComments > 0 ? "warning" : "default"} />
        <KpiCard label="WhatsApp aguardando" value={waitingWhatsapp} hint="precisam humano" icon={AlertTriangle} tone={waitingWhatsapp > 0 ? "warning" : "default"} />
        <KpiCard label="WhatsApp ativas" value={activeWhatsapp} hint="conversas abertas" icon={MessageCircle} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[14px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[16px]">Posts recentes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/blog">Ver tudo</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPosts.length === 0 && <p className="text-sm text-muted">Nenhum post ainda.</p>}
            {recentPosts.map((p) => (
              <Link
                key={p.id}
                href={`/admin/blog/${p.id}/editar`}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-soft"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{p.title}</div>
                  <div className="text-xs text-muted">{dateFmt.format(p.updatedAt)}</div>
                </div>
                <Badge variant={p.status === "published" ? "default" : "outline"}>{p.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[14px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[16px]">WhatsApp recente</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/whatsapp">Ver tudo</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentConversations.length === 0 && <p className="text-sm text-muted">Nenhuma conversa.</p>}
            {recentConversations.map((c) => (
              <Link
                key={c.id}
                href="/admin/whatsapp"
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-soft"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {c.contact.name ?? c.contact.phone}
                  </div>
                  <div className="text-xs text-muted">{dateFmt.format(c.lastMessageAt)}</div>
                </div>
                <Badge variant={c.status === "waiting_human" ? "destructive" : "outline"}>
                  {c.status}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
