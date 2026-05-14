import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ajuda · bfin",
  description:
    "Perguntas frequentes sobre o bfin: saldos diários, previsões mensais, tags, importação e mais.",
  alternates: { canonical: "/ajuda" },
  openGraph: {
    title: "Ajuda · bfin",
    description:
      "Perguntas frequentes sobre o bfin: saldos diários, previsões mensais, tags, importação e mais.",
    url: "/ajuda",
  },
};

export default function AjudaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
