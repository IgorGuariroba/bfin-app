import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, CalendarClock, Settings, Lightbulb, HelpCircle, ChevronRight, Zap, Shield } from "lucide-react";
import { LogoutButton } from "./logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserPlan } from "@/lib/plan";

export default async function MenuPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const plan = await getUserPlan(user.id!);

  const menuItems = [
    { icon: User,          label: "Editar perfil",      href: "/perfil" },
    { icon: CalendarClock, label: "Previsão de diário", href: "/previsao" },
    { icon: Settings,      label: "Configurações",       href: "/configuracoes" },
    { icon: Lightbulb,     label: "Sugestões",           href: "/sugestoes" },
    { icon: HelpCircle,    label: "Ajuda",               href: "/ajuda" },
  ];

  return (
    <div className="flex flex-col min-h-full bg-canvas px-4 pt-12 pb-24">
      {/* Profile card */}
      <Card className="flex flex-col items-center justify-center rounded-[14px] py-6 mb-8">
        <CardContent className="flex flex-col items-center p-0">
          <div className="h-20 w-20 rounded-full bg-surface-soft border border-hairline flex items-center justify-center mb-4 overflow-hidden">
            {user.image ? (
              <Image src={user.image} alt={user.name || "Usuário"} width={80} height={80} unoptimized referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              <User size={32} className="text-muted" />
            )}
          </div>
          <h2 className="text-[20px] font-semibold leading-[1.20] tracking-[-0.18px] text-ink">
            {user.name || "Usuário"}
          </h2>
          <p className="text-[14px] font-normal leading-[1.43] text-muted mt-1 mb-4">{user.email}</p>
          <Badge
            variant={plan === "pro" ? "default" : "outline"}
            className="rounded-full text-[11px] font-semibold leading-[1.18] px-[10px] py-[4px]"
          >
            {plan === "pro" ? "Assinatura ativa" : "Plano gratuito"}
          </Badge>
        </CardContent>
      </Card>

      {/* Menu items */}
      <div className="flex flex-col gap-3 mb-8">
        {user.isAdmin && (
          <Card className="rounded-[14px] py-0 border-rausch-active/30">
            <CardContent className="p-0">
              <Link
                href="/admin"
                className="flex items-center gap-3 p-4 active:scale-95 transition-transform"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rausch-active text-on-primary shrink-0">
                  <Shield size={20} />
                </div>
                <span className="flex-1 text-[16px] font-semibold leading-[1.25] text-ink">Painel admin</span>
                <ChevronRight size={20} className="text-muted" />
              </Link>
            </CardContent>
          </Card>
        )}

        {plan === "free" && (
          <Button
            variant="default"
            className="h-auto rounded-[14px] p-4 justify-start gap-3"
            asChild
          >
            <Link href="/assinar">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rausch-active text-on-primary shrink-0">
                <Zap size={20} />
              </div>
              <span className="flex-1 text-[16px] font-semibold leading-[1.25] text-on-primary">Assinar Pro</span>
              <ChevronRight size={20} className="text-on-primary/60" />
            </Link>
          </Button>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="rounded-[14px] py-0">
              <CardContent className="p-0">
                <Link
                  href={item.href}
                  className="flex items-center gap-3 p-4 active:scale-95 transition-transform"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-ink shrink-0">
                    <Icon size={20} />
                  </div>
                  <span className="flex-1 text-[16px] font-semibold leading-[1.25] text-ink">{item.label}</span>
                  <ChevronRight size={20} className="text-muted" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LogoutButton />
    </div>
  );
}
