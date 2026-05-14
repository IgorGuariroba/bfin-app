import Link from "next/link";
import { FileText, MessageCircle, Users, DollarSign, AlertTriangle, MessagesSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/admin/kpi-card";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    proUsers,
    publishedPosts,
    draftPosts,
    pendingComments,
    waitingWhatsapp,
    activeWhatsapp,
    planConfig,
    recentPosts,
    recentConversations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "pro" } }),
    prisma.post.count({ where: { status: "published" } }),
    prisma.post.count({ where: { status: "draft" } }),
    prisma.postComment.count({ where: { status: "pending" } }),
    prisma.whatsappConversation.count({ where: { status: "waiting_human" } }),
    prisma.whatsappConversation.count({ where: { status: { in: ["bot", "human", "waiting_human"] } } }),
    prisma.planConfig.findFirst().catch(() => null),
    prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.whatsappConversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 5,
      include: { contact: { select: { name: true, phone: true } } },
    }),
  ]);

  const mrr = planConfig ? proUsers * Number(planConfig.monthlyAmount) : 0;

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
