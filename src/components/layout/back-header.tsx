"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BackHeaderProps {
  title: string;
  action?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

export function BackHeader({ title, action, onBack, className }: BackHeaderProps) {
  const router = useRouter();

  return (
    <header className={cn("sticky top-0 z-30 flex items-center justify-between px-2 py-3 bg-canvas border-b border-hairline", className)}>
      <button
        onClick={onBack ?? (() => router.back())}
        className="flex items-center justify-center w-10 h-10 rounded-full text-ink hover:bg-surface-soft transition-colors"
        aria-label="Voltar"
      >
        <ChevronLeft size={24} />
      </button>

      <h1 className="text-base font-semibold text-ink">{title}</h1>

      <div className="w-10 h-10 flex items-center justify-center">
        {action ?? null}
      </div>
    </header>
  );
}
