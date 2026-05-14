import Link from "next/link";
import { ChevronRight, DollarSign, FileText, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    icon: DollarSign,
    label: "Preços",
    description: "Configurar valores do plano Pro",
    href: "/admin/precos",
  },
  {
    icon: FileText,
    label: "Blog",
    description: "Posts, tópicos e comentários",
    href: "/admin/blog",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    description: "Conversas e atendimento",
    href: "/admin/whatsapp",
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-md px-4 pt-12 pb-24">
      <header className="mb-6">
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">
          Painel admin
        </h1>
        <p className="mt-1 text-[14px] text-muted">Configurações e gestão da aplicação.</p>
      </header>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="rounded-[14px] py-0">
              <CardContent className="p-0">
                <Link
                  href={item.href}
                  className="flex items-center gap-3 p-4 active:scale-[0.98] transition-transform"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-strong text-ink">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold leading-[1.25] text-ink">
                      {item.label}
                    </p>
                    <p className="text-[13px] text-muted truncate">{item.description}</p>
                  </div>
                  <ChevronRight size={20} className="text-muted shrink-0" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
