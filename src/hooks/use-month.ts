"use client";

import { useState, useCallback } from "react";

export function useMonth(initial?: string) {
  const [month, setMonth] = useState(() => {
    if (initial) return initial;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const prev = useCallback(() => {
    setMonth((m) => {
      const [y, mo] = m.split("-").map(Number);
      const d = new Date(y, mo - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  const next = useCallback(() => {
    setMonth((m) => {
      const [y, mo] = m.split("-").map(Number);
      const d = new Date(y, mo, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  const label = (() => {
    const [y, mo] = month.split("-").map(Number);
    const date = new Date(y, mo - 1, 1);
    const monthName = date.toLocaleDateString("pt-BR", { month: "long" });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`;
  })();

  return { month, prev, next, label };
}
