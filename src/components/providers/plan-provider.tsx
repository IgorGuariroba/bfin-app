"use client";

import { createContext, useContext } from "react";
import type { Plan } from "@/lib/plan";

const PlanContext = createContext<Plan>("free");

export function PlanProvider({ plan, children }: { plan: Plan; children: React.ReactNode }) {
  return <PlanContext.Provider value={plan}>{children}</PlanContext.Provider>;
}

export function usePlanContext(): Plan {
  return useContext(PlanContext);
}
