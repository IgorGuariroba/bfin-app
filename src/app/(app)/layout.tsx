import type { Metadata } from "next";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DelegatedAccountBanner } from "@/components/layout/delegated-account-banner";
import { AddModalProvider } from "@/lib/add-modal-context";
import { QuickAddModal } from "@/components/transactions/quick-add-modal";
import { PlanProvider } from "@/components/providers/plan-provider";
import { auth } from "@/lib/auth";
import { getDelegationInfo } from "@/lib/effective-user";
import { getUserPlan } from "@/lib/plan";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const delegation = session?.user?.id ? await getDelegationInfo(session.user.id) : null;
  // Plano da conta efetiva (dono, em delegação), consistente com a API — ADR-0011.
  const plan = session?.user?.id
    ? await getUserPlan(delegation?.effectiveUserId ?? session.user.id)
    : ("free" as const);

  return (
    <AddModalProvider>
      <PlanProvider plan={plan}>
        <div className="flex min-h-full flex-col bg-canvas">
          <main className="flex-1 pb-20">{children}</main>
          {delegation?.isDelegated && (
            <DelegatedAccountBanner ownerName={delegation.ownerName ?? ""} />
          )}
          <BottomNav />
          <QuickAddModal />
        </div>
      </PlanProvider>
    </AddModalProvider>
  );
}
