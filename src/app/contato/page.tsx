import type { Metadata } from "next";
import { Mail, MessageCircle, Clock } from "lucide-react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

export const metadata: Metadata = {
  title: "Contato · bfin",
  description:
    "Fale com a equipe do bfin pelo WhatsApp ou e-mail. Atendimento Seg–Sex, 9h–18h (BRT).",
  alternates: { canonical: "/contato" },
  openGraph: {
    title: "Contato · bfin",
    description:
      "Fale com a equipe do bfin pelo WhatsApp ou e-mail. Atendimento Seg–Sex, 9h–18h (BRT).",
    url: "/contato",
  },
};

const SUPPORT_EMAIL = "contato@bfincont.com.br";

function sanitizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

function formatPhone(raw: string): string {
  const digits = sanitizePhone(raw);
  if (digits.length < 12) return raw;
  const cc = digits.slice(0, 2);
  const ddd = digits.slice(2, 4);
  const part1 = digits.slice(4, digits.length - 4);
  const part2 = digits.slice(-4);
  return `+${cc} (${ddd}) ${part1}-${part2}`;
}

export default function ContatoPage() {
  const rawPhone = process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY_NUMBER ?? "";
  const phone = sanitizePhone(rawPhone);
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        "Oi! Quero falar com a equipe do bfin."
      )}`
    : null;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />

      <main>
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24 text-center">
            <span className="inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-1 text-[11px] font-semibold tracking-wide text-ink">
              CONTATO
            </span>
            <h1 className="mt-6 text-[36px] font-bold tracking-tight leading-[1.1] md:text-[44px]">
              Fale com <span className="text-rausch">a gente</span>
            </h1>
            <p className="mt-4 text-base text-body-text">
              Dúvida, sugestão ou problema? Escolha o canal que preferir.
            </p>
          </div>
        </section>

        <section className="border-b border-hairline-soft py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-[14px] border border-hairline bg-canvas p-6 transition-shadow hover:shadow-[rgba(0,0,0,0.04)_0_2px_8px_0]"
                >
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                    <MessageCircle className="size-5" />
                  </div>
                  <h2 className="text-base font-semibold text-ink">
                    WhatsApp
                  </h2>
                  <p className="mt-1 text-sm text-body-text">
                    Resposta mais rápida no horário comercial.
                  </p>
                  <p className="mt-3 text-sm font-medium text-ink group-hover:underline">
                    {formatPhone(rawPhone)}
                  </p>
                </a>
              )}

              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="group rounded-[14px] border border-hairline bg-canvas p-6 transition-shadow hover:shadow-[rgba(0,0,0,0.04)_0_2px_8px_0]"
              >
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-surface-soft text-ink">
                  <Mail className="size-5" />
                </div>
                <h2 className="text-base font-semibold text-ink">E-mail</h2>
                <p className="mt-1 text-sm text-body-text">
                  Para assuntos formais e LGPD.
                </p>
                <p className="mt-3 text-sm font-medium text-ink group-hover:underline">
                  {SUPPORT_EMAIL}
                </p>
              </a>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-hairline bg-surface-soft p-6">
              <Clock className="size-5 shrink-0 text-ink" />
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Horário de atendimento
                </h3>
                <p className="mt-1 text-sm text-body-text">
                  Segunda a sexta, das 9h às 18h (horário de Brasília).
                  Mensagens fora desse horário são respondidas no próximo dia
                  útil.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
