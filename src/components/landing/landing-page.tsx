import Image from "next/image";
import Link from "next/link";
import {
  Wallet,
  PieChart,
  Target,
  Bell,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Wallet,
    title: "Saldos em tempo real",
    description:
      "Veja todas as contas num só lugar. Sincronize entradas e saídas sem digitar duas vezes.",
  },
  {
    icon: PieChart,
    title: "Categorias e tags",
    description:
      "Entenda pra onde vai seu dinheiro. Relatórios visuais por categoria, mês e tendência.",
  },
  {
    icon: Target,
    title: "Metas e horizonte",
    description:
      "Planeje objetivos financeiros e acompanhe a previsão de saldo nos próximos meses.",
  },
  {
    icon: Bell,
    title: "Lembretes inteligentes",
    description:
      "Sugestões automáticas pra revisar gastos, ajustar metas e não esquecer contas.",
  },
  {
    icon: ShieldCheck,
    title: "Privado e seu",
    description:
      "Seus dados ficam na sua conta. Sem venda de informação, sem rastreio invasivo.",
  },
  {
    icon: Smartphone,
    title: "Funciona no celular",
    description:
      "PWA instalável. Abra como app no Android ou iOS, com suporte offline básico.",
  },
];

const faqs = [
  {
    q: "O bfin é gratuito?",
    a: "Sim, o uso pessoal é gratuito durante o beta. Planos pagos podem surgir no futuro com features avançadas.",
  },
  {
    q: "Preciso conectar minha conta bancária?",
    a: "Não. O bfin funciona com lançamentos manuais e importação. Conexão bancária automática é opcional e está em desenvolvimento.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Os dados ficam vinculados à sua conta autenticada. Não vendemos nem compartilhamos suas informações financeiras.",
  },
  {
    q: "Funciona offline?",
    a: "Como PWA, o bfin guarda recursos localmente e abre rápido. Operações que dependem de servidor exigem conexão.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="bfin"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="text-lg font-semibold tracking-tight">bfin</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="#features">Recursos</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="#faq">FAQ</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24 md:gap-16">
            <div className="flex flex-col justify-center gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Beta aberto · grátis
              </span>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Controle financeiro{" "}
                <span className="text-primary">sem planilha</span>.
              </h1>
              <p className="text-lg text-muted-foreground">
                Organize gastos, metas e investimentos num só lugar. Simples,
                rápido, no seu bolso.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/login">Criar conta grátis</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#features">Ver recursos</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Sem cartão de crédito. Cancele quando quiser.
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent blur-3xl" />
              <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-2xl">
                <Image
                  src="/og.png"
                  alt="Tela do bfin"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-b border-border/40 py-16 md:py-24"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Tudo que você precisa pra decidir melhor
              </h2>
              <p className="mt-3 text-muted-foreground">
                Recursos pensados pra quem quer entender o próprio dinheiro sem
                virar contador.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Veja seu dinheiro em movimento
              </h2>
              <p className="mt-3 text-muted-foreground">
                Saldos, lançamentos e horizonte financeiro com leitura clara em
                qualquer tela.
              </p>
            </div>
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-2xl">
              <div className="relative aspect-video">
                <Image
                  src="/og.png"
                  alt="Preview do app bfin"
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-b border-border/40 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Perguntas frequentes
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-border/60 bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
                    {q}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Pronto pra organizar suas finanças?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Crie sua conta em menos de um minuto.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild size="lg">
                <Link href="/login">Começar agora</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="bfin"
              width={20}
              height={20}
              className="rounded"
            />
            <span>© {new Date().getFullYear()} bfin</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">
              Entrar
            </Link>
            <Link href="#features" className="hover:text-foreground">
              Recursos
            </Link>
            <Link href="#faq" className="hover:text-foreground">
              FAQ
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
