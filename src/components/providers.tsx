"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

// React 19 warns about <script> tags in component trees; next-themes still uses this pattern
// for SSR theme initialization. The script runs correctly on first HTML parse — the warning
// is a false positive. Filter it until next-themes ships a fix.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const _error = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering")) return;
    _error(...args);
  };
}

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  // Visitante/deslogado: primeira impressão sempre clara (independente do SO).
  // Logado: respeita a escolha do usuário (system / light / dark).
  // A sessão vem do servidor (JWT), então a decisão é tomada no SSR — sem flash.
  const forcedTheme = session?.user ? undefined : "light";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={forcedTheme}
      disableTransitionOnChange
    >
      <SessionProvider session={session}>
        {children}
        <Toaster position="top-center" richColors />
      </SessionProvider>
    </ThemeProvider>
  );
}
