"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type UpsellContext = "saldos" | "totais" | "horizonte";

const CONTEXT_COPY: Record<UpsellContext, { title: string; bullets: string[] }> = {
  saldos: {
    title: "Veja seus saldos futuros",
    bullets: [
      "Projeção de saldos diários adiante",
      "Navegue meses à frente sem limite",
      "Planeje com dados reais do seu fluxo",
    ],
  },
  totais: {
    title: "Acompanhe seus totais mês a mês",
    bullets: [
      "Performance e custo de vida futuros",
      "Diário médio projetado com precisão",
      "Comparativo mês a mês ilimitado",
    ],
  },
  horizonte: {
    title: "Planeje com visão completa do horizonte",
    bullets: [
      "Horizonte de saldos sem limite de meses",
      "Visão panorâmica do fluxo de caixa",
      "Navegue livremente pelo futuro",
    ],
  },
};

interface ProUpsellSheetProps {
  open: boolean;
  onClose: () => void;
  context: UpsellContext;
}

export function ProUpsellSheet({ open, onClose, context }: ProUpsellSheetProps) {
  const router = useRouter();
  const copy = CONTEXT_COPY[context];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="!h-[100dvh] !max-h-[100dvh] flex flex-col gap-0 pt-12 rounded-t-[14px]"
      >
        <SheetHeader className="items-center text-center">
          <div
            className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#ff385c" }}
          >
            <Lock className="text-white" size={24} />
          </div>
          <SheetTitle className="text-[22px] font-medium text-[#222222] leading-[1.18] tracking-[-0.44px]">
            {copy.title}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Desbloqueie recursos do plano Pro
          </SheetDescription>
        </SheetHeader>

        <ul className="px-6 py-6 space-y-3">
          {copy.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[14px] leading-[1.43] text-[#3f3f3f]">
              <span
                className="mt-[7px] w-[6px] h-[6px] rounded-full shrink-0"
                style={{ backgroundColor: "#ff385c" }}
              />
              {b}
            </li>
          ))}
        </ul>

        <div className="px-6 pb-6 flex flex-col gap-2 mt-auto">
          <Button
            size="lg"
            className="w-full h-12 text-[16px] font-medium rounded-[8px] text-white border-0"
            style={{ backgroundColor: "#ff385c" }}
            onClick={() => {
              onClose();
              router.push("/assinar");
            }}
          >
            Desbloquear com Pro
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full h-12 text-[14px] font-medium text-[#6a6a6a] rounded-[8px]"
            onClick={onClose}
          >
            Depois
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
