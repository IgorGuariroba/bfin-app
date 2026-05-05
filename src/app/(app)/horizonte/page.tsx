"use client";

import { useState, useEffect, useCallback } from "react";
import { BackHeader } from "@/components/layout/back-header";
import {
  HorizonteGrid,
  addMonths,
  type MonthData,
} from "@/components/horizonte/horizonte-grid";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function HorizontePage() {
  const [firstMonth, setFirstMonth] = useState(() => addMonths(currentMonth(), -1));
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(false);

  const months: [string, string, string] = [
    firstMonth,
    addMonths(firstMonth, 1),
    addMonths(firstMonth, 2),
  ];

  const fetchData = useCallback(async (ms: [string, string, string]) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        ms.map((m) =>
          fetch(`/api/saldos?month=${m}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((entries: { day: number; accSaldo: number }[]) => ({
              month: m,
              entries,
            }))
        )
      );
      setData(results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(months);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstMonth]);

  const shift = useCallback((delta: number) => {
    setFirstMonth((m) => addMonths(m, delta));
  }, []);

  return (
    <div className="flex flex-col">
      <BackHeader title="Horizonte" />
      <HorizonteGrid
        months={months}
        data={data}
        loading={loading}
        onPrev={() => shift(-3)}
        onNext={() => shift(3)}
        onShift={shift}
      />
    </div>
  );
}
