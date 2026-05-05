"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PieChart, Plus, Tags, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAddModal } from "@/lib/add-modal-context";

const items = [
  { label: "Saldos", href: "/saldos", icon: LayoutGrid },
  { label: "Totais", href: "/totais", icon: PieChart },
  { label: "Add", href: "#", icon: Plus, isFab: true },
  { label: "Tags", href: "/tags", icon: Tags },
  { label: "Menu", href: "/menu", icon: Menu },
];

export function BottomNav() {
  const pathname = usePathname();
  const { setOpen } = useAddModal();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-hairline bg-canvas px-2 pb-safe shadow-[0_-1px_0_0_rgba(0,0,0,0.05)]">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.isFab) {
          return (
            <button
              key={item.label}
              className="flex -translate-y-4 items-center justify-center rounded-full bg-primary p-4 text-white shadow-lg active:scale-95 transition-transform"
              onClick={() => setOpen(true)}
            >
              <Icon size={28} strokeWidth={2.5} />
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-ink"
            )}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
