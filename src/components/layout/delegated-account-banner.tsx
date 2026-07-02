"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, LogOut } from "lucide-react";

interface Props {
  ownerName: string;
}

export function DelegatedAccountBanner({ ownerName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const firstName = ownerName.split(" ")[0];

  async function handleExit() {
    setLoading(true);
    await fetch("/api/invites/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: null }),
    });
    router.push("/saldos");
    router.refresh();
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Floating button */}
      <div className="fixed bottom-[88px] right-4 z-50">
        {open && (
          <div className="mb-2 w-52 rounded-2xl bg-surface shadow-lg border border-hairline overflow-hidden">
            <div className="px-4 py-3 border-b border-hairline">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Gerenciando conta de</p>
              <p className="text-sm font-bold text-ink truncate">{ownerName}</p>
            </div>
            <button
              onClick={handleExit}
              disabled={loading}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
              Sair desta conta
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary shadow-lg text-white transition-transform active:scale-95"
          title={`Conta de ${firstName}`}
        >
          <Users size={20} />
        </button>
      </div>
    </>
  );
}
