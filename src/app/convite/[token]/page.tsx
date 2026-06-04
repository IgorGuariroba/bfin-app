"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, CheckCircle, XCircle, Loader2 } from "lucide-react";

type State = "loading" | "ready" | "accepting" | "success" | "error";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [ownerName, setOwnerName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Libera a UI só após montar no cliente (gate de hidratação) — transição de
    // mount única, não loop de render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState("ready");
  }, []);

  async function handleAccept() {
    setState("accepting");
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.status === 401) {
        router.push(`/login?callbackUrl=/convite/${token}`);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Erro ao aceitar convite");
        setState("error");
        return;
      }

      setOwnerName(data.owner?.name ?? "");
      setState("success");

      setTimeout(() => router.push("/saldos"), 2500);
    } catch {
      setErrorMsg("Erro de rede. Tente novamente.");
      setState("error");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm rounded-3xl bg-surface p-8 shadow-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users size={32} className="text-primary" />
          </div>
        </div>

        {(state === "loading" || state === "ready") && (
          <>
            <h1 className="mb-2 text-xl font-bold text-ink">Convite para gerenciar conta</h1>
            <p className="mb-8 text-sm text-muted-foreground">
              Você foi convidado para gerenciar uma conta no bfin. Aceite para ter acesso.
            </p>
            <button
              onClick={handleAccept}
              className="w-full rounded-2xl bg-primary py-3 font-semibold text-white transition-transform active:scale-95"
            >
              Aceitar convite
            </button>
          </>
        )}

        {state === "accepting" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Aceitando convite...</p>
          </div>
        )}

        {state === "success" && (
          <>
            <div className="mb-4 flex justify-center">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-ink">Convite aceito!</h2>
            <p className="text-sm text-muted-foreground">
              {ownerName ? `Agora você gerencia a conta de ${ownerName}.` : "Acesso concedido."} Redirecionando...
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mb-4 flex justify-center">
              <XCircle size={48} className="text-red-500" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-ink">Ops!</h2>
            <p className="mb-6 text-sm text-muted-foreground">{errorMsg}</p>
            <button
              onClick={() => router.push("/saldos")}
              className="w-full rounded-2xl border border-hairline py-3 font-semibold text-ink transition-transform active:scale-95"
            >
              Ir para o app
            </button>
          </>
        )}
      </div>
    </div>
  );
}
