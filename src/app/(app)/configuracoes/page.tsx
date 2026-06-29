"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Users,
  UserPlus,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  Loader2,
  Star,
  Sun,
  Moon,
  Monitor,
  Lock,
} from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import { AutoBaixaDiarioToggle } from "@/components/configuracoes/auto-baixa-diario-toggle";

type Invite = {
  id: string;
  inviteEmail: string;
  status: string;
  role: string;
  createdAt: string;
  member?: { name: string; email: string; image?: string } | null;
};

type ReceivedInvite = {
  id: string;
  owner: { id: string; name: string; email: string; image?: string };
};

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { plan } = usePlan();
  const [sent, setSent] = useState<Invite[]>([]);
  const [received, setReceived] = useState<ReceivedInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);
  const [preferredOwnerId, setPreferredOwnerId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/invites");
    if (res.ok) {
      const data = await res.json();
      setSent(data.sent);
      setReceived(data.received);
      setActiveOwnerId(data.activeOwnerId ?? null);
      setPreferredOwnerId(data.preferredOwnerId ?? null);
    }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    setInviteUrl("");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar convite");
      } else {
        setInviteUrl(data.inviteUrl);
        setEmail("");
        loadData();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/invites/${id}`, { method: "DELETE" });
    loadData();
  }

  async function copyInviteUrl() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function switchAccount(ownerId: string | null, preferred = false) {
    setSwitching(true);
    const res = await fetch("/api/invites/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, preferred }),
    });
    if (res.ok) {
      setActiveOwnerId(ownerId);
      setPreferredOwnerId(preferred ? ownerId : preferredOwnerId);
      router.push("/saldos");
      router.refresh();
    }
    setSwitching(false);
  }

  async function togglePreferred(inv: ReceivedInvite) {
    const isCurrentPreferred = preferredOwnerId === inv.owner.id;
    const newPreferred = isCurrentPreferred ? false : true;
    setSwitching(true);
    const res = await fetch("/api/invites/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: inv.owner.id, preferred: newPreferred }),
    });
    if (res.ok) {
      setPreferredOwnerId(newPreferred ? inv.owner.id : null);
      if (!activeOwnerId) setActiveOwnerId(inv.owner.id);
    }
    setSwitching(false);
  }

  return (
    <div className="flex flex-col min-h-full bg-canvas px-4 pt-12 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-ink">Configurações</h1>
      </div>

      {/* Contas que gerencio */}
      {received.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Contas que você gerencia
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Toque na estrela para entrar nessa conta automaticamente ao fazer login.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => switchAccount(null)}
              disabled={switching}
              className={`flex items-center gap-3 rounded-2xl p-4 shadow-sm transition-transform active:scale-95 ${
                !activeOwnerId ? "bg-primary/10 border border-primary/30" : "bg-surface"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users size={20} className="text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-ink">Minha conta</p>
                <p className="text-xs text-muted-foreground">Padrão original</p>
              </div>
              {!activeOwnerId && <Check size={18} className="text-primary" />}
            </button>

            {received.map((inv) => {
              const isActive = activeOwnerId === inv.owner.id;
              const isPreferred = preferredOwnerId === inv.owner.id;
              return (
                <div
                  key={inv.id}
                  className={`flex items-center gap-3 rounded-2xl p-4 shadow-sm ${
                    isActive ? "bg-primary/10 border border-primary/30" : "bg-surface"
                  }`}
                >
                  {inv.owner.image ? (
                    <img
                      src={inv.owner.image}
                      alt={inv.owner.name}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft">
                      <Users size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <button
                    onClick={() => switchAccount(inv.owner.id)}
                    disabled={switching}
                    className="flex-1 text-left"
                  >
                    <p className="font-semibold text-ink">{inv.owner.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.owner.email}</p>
                  </button>
                  <button
                    onClick={() => togglePreferred(inv)}
                    disabled={switching}
                    title={isPreferred ? "Remover como padrão" : "Definir como padrão"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      isPreferred
                        ? "text-amber-400 hover:text-amber-500"
                        : "text-muted-foreground hover:text-amber-400"
                    }`}
                  >
                    <Star size={18} fill={isPreferred ? "currentColor" : "none"} />
                  </button>
                  {isActive && <Check size={18} className="text-primary" />}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Aparência */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Aparência
        </h2>
        <div className="rounded-3xl bg-surface p-4 shadow-sm">
          <div className="flex gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-2xl py-4 transition-colors ${
                    active
                      ? "bg-primary/10 border border-primary/30 text-primary"
                      : "bg-canvas text-muted-foreground hover:text-ink"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gasto diário (baixa automática) */}
      <AutoBaixaDiarioToggle />

      {/* Convidar */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Convidar gestor
        </h2>
        <div className="rounded-3xl bg-surface p-5 shadow-sm">
          {plan === "free" ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
                <Lock size={22} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-ink">Disponível no plano Pro</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Convide outros usuários para gerenciar sua conta com o plano Pro.
                </p>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleInvite} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60 transition-transform active:scale-95"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  Enviar convite
                </button>
              </form>

              {inviteUrl && (
                <div className="mt-4 rounded-xl bg-canvas p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Link do convite:
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 truncate text-xs text-ink">{inviteUrl}</p>
                    <button
                      onClick={copyInviteUrl}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-muted-foreground transition-colors hover:text-primary"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Gestores da minha conta */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Gestores da sua conta
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : sent.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            Nenhum convite enviado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sent.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft">
                  <Users size={20} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-ink">
                    {invite.member?.name ?? invite.inviteEmail}
                  </p>
                  {invite.member && (
                    <p className="truncate text-xs text-muted-foreground">{invite.inviteEmail}</p>
                  )}
                  <span
                    className={`text-xs font-medium ${
                      invite.status === "active" ? "text-green-600" : "text-amber-500"
                    }`}
                  >
                    {invite.status === "active" ? "Ativo" : "Pendente"}
                  </span>
                </div>
                <button
                  onClick={() => handleRevoke(invite.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
