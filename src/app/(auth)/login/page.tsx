"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

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
    <div className="w-full max-w-sm space-y-6">
      <div className="flex justify-center mb-2">
        {/* Ilustração / Logo decorativo */}
        <div className="w-16 h-16 rounded-2xl bg-rausch/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-rausch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>

      <Card className="w-full border-hairline bg-canvas shadow-none">
        <CardHeader className="text-center pb-2 pt-6">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">bfin</h1>
          <p className="text-sm text-muted">
            Controle financeiro pessoal
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Google */}
          <Button
            variant="outline"
            className="w-full h-12 border-hairline text-ink hover:bg-muted/30 transition-colors"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </Button>

          <div className="relative">
            <Separator className="bg-hairline" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-canvas px-3 text-[11px] uppercase font-medium text-muted-foreground tracking-wider">
              ou entrar com email
            </span>
          </div>

          {/* Email/Password */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-ink">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="demo@bfin.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-hairline focus-visible:ring-rausch/20 focus-visible:border-rausch"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-ink">
                  Senha
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 border-hairline focus-visible:ring-rausch/20 focus-visible:border-rausch"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-rausch">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-rausch text-white hover:bg-rausch/90 font-medium rounded-lg transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="text-center space-y-1 pt-2">
            <p className="text-xs text-muted-foreground">
              Demo: <span className="text-ink font-medium">demo@bfin.app</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Senha: <span className="text-ink font-medium">demo123</span>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center text-[11px] text-muted-foreground px-6 leading-relaxed">
        Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
      </p>
    </div>
  );
}
