"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CardIllustration() {
  const coins = [
    { w: 36, h: 36, top: 0,   left: 130, bg: "linear-gradient(135deg,#f0c830,#c88820)" },
    { w: 28, h: 28, top: 60,  left: 156, bg: "linear-gradient(135deg,#e85d2f,#c84020)" },
    { w: 32, h: 32, top: 96,  left: 148, bg: "linear-gradient(135deg,#f0c830,#c88820)" },
    { w: 26, h: 26, top: 110, left: 110, bg: "linear-gradient(135deg,#f0c830,#d09020)" },
    { w: 30, h: 30, top: 118, left: 60,  bg: "linear-gradient(135deg,#f0c830,#c88820)" },
    { w: 24, h: 24, top: 108, left: 16,  bg: "linear-gradient(135deg,#e85d2f,#c84020)" },
    { w: 20, h: 20, top: 4,   left: 96,  bg: "linear-gradient(135deg,#f0c830,#d09020)" },
  ];

  return (
    <div className="relative shrink-0" style={{ width: 210, height: 160 }}>
      <div
        className="absolute flex flex-col justify-end"
        style={{
          left: 16, top: 28, width: 140, height: 90,
          borderRadius: 14,
          background: "linear-gradient(135deg, #ff385c 0%, #ff6b7a 100%)",
          boxShadow: "0 8px 24px rgba(255,56,92,0.3)",
          padding: "10px 14px",
        }}
      >
        <div
          className="absolute"
          style={{
            top: 16, left: 14, width: 28, height: 20, borderRadius: 4,
            background: "linear-gradient(135deg,#e8d48a,#c8a830)",
          }}
        />
        <div className="flex gap-[5px] mb-1.5">
          {[0, 1, 2, 3].map((g) => (
            <div key={g} className="flex gap-0.5">
              {[0, 1, 2, 3].map((d) => (
                <div
                  key={d}
                  className="rounded-full"
                  style={{ width: 4, height: 4, background: "rgba(255,255,255,0.6)" }}
                />
              ))}
            </div>
          ))}
        </div>
        <div
          className="inline-block self-start"
          style={{ background: "rgba(255,255,255,0.18)", borderRadius: 4, padding: "2px 7px" }}
        >
          <span className="text-white font-semibold" style={{ fontSize: 8, letterSpacing: 0.5 }}>
            suas finanças
          </span>
        </div>
      </div>
      {coins.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: c.top, left: c.left, width: c.w, height: c.h,
            background: c.bg, boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Email ou senha inválidos");
    } else {
      router.push("/saldos");
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    await signIn("google", { callbackUrl: "/saldos" });
  }

  return (
    <div className="w-full max-w-[360px] flex flex-col items-center px-7 py-8">
      {/* Logo */}
      <div
        className="text-rausch font-bold"
        style={{ fontSize: 48, letterSpacing: -2, lineHeight: 1 }}
      >
        bfin
      </div>
      <p className="mt-1 text-sm text-muted-foreground text-center">
        Controle financeiro simples e eficaz
      </p>

      {/* Illustration */}
      <div className="my-8">
        <CardIllustration />
      </div>

      {/* Google — button-secondary (white + ink outline, 8px radius, 48h) */}
      <button
        onClick={handleGoogleLogin}
        className="w-full h-12 rounded-lg border border-ink bg-canvas text-ink text-base font-medium flex items-center justify-center gap-2.5 transition-colors hover:bg-surface-soft"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continuar com Google
      </button>

      {/* Separator */}
      <div className="flex items-center gap-3 w-full my-4">
        <div className="flex-1 h-px bg-hairline" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="flex-1 h-px bg-hairline" />
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-12 rounded-lg bg-rausch text-on-primary text-base font-medium transition-colors hover:bg-rausch-active"
        >
          Entrar com e-mail
        </button>
      ) : (
        <form onSubmit={handleCredentialsLogin} className="w-full flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-sm text-ink font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="demo@bfin.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 rounded-lg border-hairline focus-visible:ring-0 focus-visible:border-ink focus-visible:border-2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-sm text-ink font-medium">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 rounded-lg border-hairline focus-visible:ring-0 focus-visible:border-ink focus-visible:border-2"
            />
          </div>
          {error && <p className="text-sm text-error font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-rausch text-on-primary text-base font-medium transition-colors hover:bg-rausch-active disabled:bg-rausch-disabled disabled:cursor-not-allowed"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Demo: <strong className="text-ink">demo@bfin.app</strong> / <strong className="text-ink">demo123</strong>
          </p>
        </form>
      )}

      {/* Legal sub-band */}
      <div className="mt-5 text-center leading-[1.6]" style={{ fontSize: 13 }}>
        <span className="text-muted-foreground">Ao continuar, você concorda com os</span>
        <br />
        <a href="#" className="text-legal-link hover:underline">Termos de Uso</a>
        <span className="text-muted-foreground"> e </span>
        <a href="#" className="text-legal-link hover:underline">Política de Privacidade</a>
      </div>
    </div>
  );
}
