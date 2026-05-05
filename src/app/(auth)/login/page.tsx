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
    <div style={{ width: 210, height: 160, position: "relative", flexShrink: 0 }}>
      {/* Card */}
      <div style={{
        position: "absolute", left: 16, top: 28,
        width: 140, height: 90, borderRadius: 14,
        background: "linear-gradient(135deg, #ff385c 0%, #ff6b7a 100%)",
        boxShadow: "0 8px 24px rgba(255,56,92,0.3)",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "10px 14px",
      }}>
        {/* Chip */}
        <div style={{
          position: "absolute", top: 16, left: 14,
          width: 28, height: 20, borderRadius: 4,
          background: "linear-gradient(135deg,#e8d48a,#c8a830)",
        }} />
        {/* Dots */}
        <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
          {[0, 1, 2, 3].map(g => (
            <div key={g} style={{ display: "flex", gap: 2 }}>
              {[0, 1, 2, 3].map(d => (
                <div key={d} style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
              ))}
            </div>
          ))}
        </div>
        {/* Label */}
        <div style={{
          background: "rgba(255,255,255,0.18)", borderRadius: 4,
          padding: "2px 7px", display: "inline-block", alignSelf: "flex-start",
        }}>
          <span style={{ fontSize: 8, color: "white", fontWeight: 600, letterSpacing: 0.5 }}>suas finanças</span>
        </div>
      </div>
      {/* Coins */}
      {coins.map((c, i) => (
        <div key={i} style={{
          position: "absolute", top: c.top, left: c.left,
          width: c.w, height: c.h, borderRadius: "50%",
          background: c.bg,
          boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
        }} />
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
    <div style={{
      width: "100%", maxWidth: 360,
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "32px 28px",
      gap: 0,
    }}>
      {/* Logo */}
      <div style={{ fontSize: 48, fontWeight: 800, color: "#ff385c", letterSpacing: -2, marginBottom: 4 }}>
        bfin
      </div>
      <div style={{ fontSize: 14, color: "#717171", textAlign: "center", fontWeight: 400, marginBottom: 0 }}>
        Controle financeiro simples e eficaz
      </div>

      {/* Illustration */}
      <div style={{ margin: "28px 0 32px" }}>
        <CardIllustration />
      </div>

      {/* Buttons */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%", padding: "14px 16px",
            borderRadius: 9999, border: "1.5px solid #e0e0e0",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            fontSize: 15, fontWeight: 500, cursor: "pointer",
            background: "white", color: "#1a1a1a",
            fontFamily: "inherit",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar com Google
        </button>
      </div>

      {/* Separator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        width: "100%", margin: "16px 0",
      }}>
        <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
        <span style={{ fontSize: 12, color: "#717171" }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
      </div>

      {/* Email button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: "100%", padding: "14px 16px",
            borderRadius: 9999, border: "1.5px solid #ff385c",
            fontSize: 15, fontWeight: 500, color: "#ff385c",
            cursor: "pointer", background: "none",
            fontFamily: "inherit",
          }}
        >
          Entrar com e-mail
        </button>
      ) : (
        <form onSubmit={handleCredentialsLogin} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label htmlFor="email" style={{ fontSize: 14, color: "#1a1a1a" }}>Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="demo@bfin.app"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-11 border-hairline focus-visible:ring-rausch/20 focus-visible:border-rausch"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label htmlFor="password" style={{ fontSize: 14, color: "#1a1a1a" }}>Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="h-11 border-hairline focus-visible:ring-rausch/20 focus-visible:border-rausch"
            />
          </div>
          {error && <p style={{ fontSize: 14, color: "#ff385c", fontWeight: 500 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px 16px",
              borderRadius: 9999, border: "none",
              fontSize: 15, fontWeight: 500, color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              background: "#ff385c", fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <p style={{ fontSize: 12, color: "#717171", textAlign: "center" }}>
            Demo: <strong style={{ color: "#1a1a1a" }}>demo@bfin.app</strong> / <strong style={{ color: "#1a1a1a" }}>demo123</strong>
          </p>
        </form>
      )}

      {/* Footer */}
      <div style={{ marginTop: 20, fontSize: 12, color: "#717171", textAlign: "center", lineHeight: 1.6 }}>
        Ao continuar, você concorda com os<br />
        <a href="#" style={{ color: "#ff385c", textDecoration: "none", fontWeight: 600 }}>Termos de Uso</a>
        {" "}e{" "}
        <a href="#" style={{ color: "#ff385c", textDecoration: "none", fontWeight: 600 }}>Política de Privacidade</a>
      </div>
    </div>
  );
}
