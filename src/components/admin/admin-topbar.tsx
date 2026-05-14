"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AdminSidebar } from "./admin-sidebar";

const LABELS: Record<string, string> = {
  admin: "Dashboard",
  precos: "Preços",
  blog: "Blog",
  whatsapp: "WhatsApp",
  topicos: "Tópicos",
  comentarios: "Comentários",
  novo: "Novo post",
  editar: "Editar",
};

function buildCrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = LABELS[seg] ?? seg;
    crumbs.push({ href: acc, label });
  }
  return crumbs;
}

export function AdminTopbar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const crumbs = buildCrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-hairline bg-canvas/95 px-4 backdrop-blur md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
            <Menu size={18} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu admin</SheetTitle>
          <SheetDescription className="sr-only">Navegação do painel admin</SheetDescription>
          <AdminSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm text-muted">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted/50">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-ink">{c.label}</span>
            ) : (
              <Link href={c.href} className="hover:text-ink">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden sm:inline-flex">Admin</Badge>
        <div className="hidden text-right text-xs md:block">
          <div className="font-medium text-ink">{userName}</div>
          <div className="text-muted">{userEmail}</div>
        </div>
      </div>
    </header>
  );
}
