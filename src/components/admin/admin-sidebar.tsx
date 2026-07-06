"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, DollarSign, FileText, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/precos", label: "Preços", icon: DollarSign },
  { href: "/admin/blog", label: "Blog", icon: FileText },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="px-2 pb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Admin</div>
        <div className="mt-1 text-[18px] font-semibold text-ink">bfin</div>
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-surface-strong text-ink"
                  : "text-body-text hover:bg-surface-soft hover:text-ink",
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <Link
        href="/saldos"
        onClick={onNavigate}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-body-text transition-colors hover:bg-surface-soft hover:text-ink"
      >
        <ArrowLeft size={16} />
        Voltar ao app
      </Link>
    </nav>
  );
}
