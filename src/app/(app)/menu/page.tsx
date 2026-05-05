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
    {
      icon: User,
      label: "Editar perfil",
      href: "#", // stub
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: CalendarClock,
      label: "Previsão de diário",
      href: "/previsao",
      color: "text-amber",
      bgColor: "bg-amber/10",
    },
    {
      icon: Settings,
      label: "Configurações",
      href: "/configuracoes",
      color: "text-ink",
      bgColor: "bg-surface-soft",
    },
    {
      icon: Lightbulb,
      label: "Sugestões",
      href: "#", // stub
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: HelpCircle,
      label: "Ajuda",
      href: "#", // stub
      color: "text-green",
      bgColor: "bg-green/10",
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-canvas px-4 pt-12 pb-24">
      <h1 className="text-2xl font-bold text-ink mb-6">Menu</h1>

      {/* Profile Card */}
      <div className="flex flex-col items-center justify-center rounded-3xl bg-surface p-6 shadow-sm mb-8">
        <div className="h-20 w-20 rounded-full bg-surface-soft border-2 border-hairline flex items-center justify-center mb-4 overflow-hidden">
          {user.image ? (
            <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
          ) : (
            <User size={32} className="text-muted-foreground" />
          )}
        </div>
        <h2 className="text-xl font-bold text-ink">{user.name || "Usuário"}</h2>
        <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
        
        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0 font-semibold px-3 py-1">
          Assinatura ativa
        </Badge>
      </div>

      {/* Menu Options */}
      <div className="flex flex-col gap-3 mb-8">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={i}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm transition-transform active:scale-95"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bgColor} ${item.color}`}>
                <Icon size={20} />
              </div>
              <span className="flex-1 font-semibold text-ink">{item.label}</span>
              <ChevronRight size={20} className="text-muted-foreground" />
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <LogoutButton />
    </div>
  );
}
