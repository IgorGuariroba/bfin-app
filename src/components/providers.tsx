"use client";

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        {children}
        <Toaster position="top-center" richColors />
      </SessionProvider>
    </ThemeProvider>
  );
}
