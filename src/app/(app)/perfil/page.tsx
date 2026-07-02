"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, User, Loader2, Check } from "lucide-react";
import { AssistentePanel } from "@/components/assistente/assistente-panel";

export default function EditarPerfilPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const user = session?.user;

  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword && newPassword !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    const body: Record<string, string> = {};
    if (name.trim() !== (user?.name ?? "")) body.name = name.trim();
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    if (Object.keys(body).length === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar");
      } else {
        await update({ name: data.name });
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-canvas px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-strong text-ink"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[22px] font-semibold leading-[1.18] tracking-[-0.44px] text-ink">
          Editar perfil
        </h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-20 w-20 rounded-full bg-surface-soft border border-hairline flex items-center justify-center overflow-hidden">
          {user?.image ? (
            <img src={user.image} alt={user.name ?? ""} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <User size={32} className="text-[#6a6a6a]" />
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nome */}
        <div className="flex flex-col gap-1">
          <label className="text-[14px] font-medium text-[#6a6a6a]">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-[8px] border border-[#dddddd] bg-canvas px-3 py-[14px] text-[16px] text-ink placeholder:text-[#929292] focus:outline-none focus:border-[2px] focus:border-ink h-[56px]"
          />
        </div>

        {/* Email (readonly) */}
        <div className="flex flex-col gap-1">
          <label className="text-[14px] font-medium text-[#6a6a6a]">Email</label>
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            className="w-full rounded-[8px] border border-[#dddddd] bg-surface-soft px-3 py-[14px] text-[16px] text-[#929292] h-[56px] cursor-not-allowed"
          />
        </div>

        {/* Trocar senha — só para contas com credenciais */}
        <div
          className="rounded-[14px] bg-surface-card p-4 mt-2"
          style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px" }}
        >
          <p className="text-[14px] font-semibold text-ink mb-4">Trocar senha</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[14px] font-medium text-[#6a6a6a]">Senha atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-[8px] border border-[#dddddd] bg-canvas px-3 py-[14px] text-[16px] text-ink placeholder:text-[#929292] focus:outline-none focus:border-[2px] focus:border-ink h-[56px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[14px] font-medium text-[#6a6a6a]">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-[8px] border border-[#dddddd] bg-canvas px-3 py-[14px] text-[16px] text-ink placeholder:text-[#929292] focus:outline-none focus:border-[2px] focus:border-ink h-[56px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[14px] font-medium text-[#6a6a6a]">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-[8px] border border-[#dddddd] bg-canvas px-3 py-[14px] text-[16px] text-ink placeholder:text-[#929292] focus:outline-none focus:border-[2px] focus:border-ink h-[56px]"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-[14px] text-[#c13515]">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-[8px] bg-primary py-[14px] text-[16px] font-medium text-white h-[48px] disabled:opacity-60 transition-transform active:scale-95 mt-2"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : success ? (
            <>
              <Check size={18} />
              Salvo
            </>
          ) : (
            "Salvar"
          )}
        </button>
      </form>

      <AssistentePanel />
    </div>
  );
}
