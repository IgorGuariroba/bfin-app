"use client";

import { useEffect } from "react";

/**
 * Captura de atribuição de marketing (ADR-0010).
 *
 * Lê o identificador de clique da query da página de entrada e guarda num
 * cookie first-party. O anúncio do Google Ads chega como `?gclid=...` no caso
 * geral, mas usa `gbraid`/`wbraid` quando o `gclid` não está disponível
 * (tráfego iOS/app, privacidade) — capturamos qualquer um dos três.
 * O cookie sobrevive ao redirect do OAuth do Google; no cadastro, o evento
 * `createUser` (server) lê esses cookies e persiste no `User`, fechando a
 * trilha de atribuição até a Conversão reportada pelo webhook.
 *
 * Renderiza nada. Só grava os identificadores presentes na URL.
 */

// Janela de conversão padrão do Google Ads: 90 dias.
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
const CLICK_ID_PARAMS = ["gclid", "gbraid", "wbraid"] as const;

export function GclidCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const secure = window.location.protocol === "https:" ? "; secure" : "";

    for (const name of CLICK_ID_PARAMS) {
      const value = params.get(name);
      if (!value) continue;
      document.cookie = `bfin_${name}=${encodeURIComponent(
        value,
      )}; max-age=${MAX_AGE_SECONDS}; path=/; samesite=lax${secure}`;
    }
  }, []);

  return null;
}
