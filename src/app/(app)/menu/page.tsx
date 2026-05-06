import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, CalendarClock, Settings, Lightbulb, HelpCircle, ChevronRight } from "lucide-react";
import { LogoutButton } from "./logout-button";
import { Badge } from "@/components/ui/badge";

export default async function MenuPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  const menuItems = [
    { icon: User,        label: "Editar perfil",      href: "/perfil" },
    { icon: CalendarClock, label: "Previsão de diário", href: "/previsao" },
    { icon: Settings,    label: "Configurações",       href: "/configuracoes" },
    { icon: Lightbulb,   label: "Sugestões",           href: "#" },
    { icon: HelpCircle,  label: "Ajuda",               href: "#" },
  ];

  return (
    <div className="flex flex-col min-h-full bg-canvas px-4 pt-12 pb-24">
      {/* Profile Card — rounded-md (14px), single shadow tier, spacing.lg (24px) */}
      <div
        className="flex flex-col items-center justify-center rounded-[14px] bg-surface-card p-6 mb-8"
        style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px" }}
      >
        <div className="h-20 w-20 rounded-full bg-surface-soft border border-hairline flex items-center justify-center mb-4 overflow-hidden">
          {user.image ? (
            <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
          ) : (
            <User size={32} className="text-muted" />
          )}
        </div>
        {/* display-sm: 20px/600 */}
        <h2 className="text-[20px] font-semibold leading-[1.20] tracking-[-0.18px] text-ink">{user.name || "Usuário"}</h2>
        {/* body-sm: 14px/400, muted #6a6a6a */}
        <p className="text-[14px] font-normal leading-[1.43] text-[#6a6a6a] mt-1 mb-4">{user.email}</p>

        {/* badge: 11px/600, rounded-full, primary #ff385c */}
        <Badge
          variant="secondary"
          className="rounded-full bg-green-100 text-green-700 hover:bg-green-200 border-0 text-[11px] font-semibold leading-[1.18] px-[10px] py-[4px]"
        >
          Assinatura ativa
        </Badge>
      </div>

      {/* Menu Options — rounded-md (14px), spacing.base (16px) padding, spacing.md (12px) gap */}
      <div className="flex flex-col gap-3 mb-8">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={i}
              href={item.href}
              className="flex items-center gap-3 rounded-[14px] bg-surface-card p-4 transition-transform active:scale-95"
              style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px" }}
            >
              {/* icon-button-circle: surface-strong bg, ink text, rounded-full, 40px */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-ink">
                <Icon size={20} />
              </div>
              {/* title-md: 16px/600 */}
              <span className="flex-1 text-[16px] font-semibold leading-[1.25] text-ink">{item.label}</span>
              <ChevronRight size={20} className="text-muted" />
            </Link>
          );
        })}
      </div>

      <LogoutButton />
    </div>
  );
}
