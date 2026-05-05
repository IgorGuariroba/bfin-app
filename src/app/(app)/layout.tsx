import { BottomNav } from "@/components/layout/bottom-nav";
import { DelegatedAccountBanner } from "@/components/layout/delegated-account-banner";
import { AddModalProvider } from "@/lib/add-modal-context";
import { QuickAddModal } from "@/components/transactions/quick-add-modal";
import { auth } from "@/lib/auth";
import { getDelegationInfo } from "@/lib/effective-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const delegation = session?.user?.id
    ? await getDelegationInfo(session.user.id)
    : null;

  return (
    <AddModalProvider>
      <div className="flex min-h-full flex-col bg-canvas">
        <main className="flex-1 pb-20">{children}</main>
        {delegation?.isDelegated && (
          <DelegatedAccountBanner ownerName={delegation.ownerName ?? ""} />
        )}
        <BottomNav />
        <QuickAddModal />
      </div>
    </AddModalProvider>
  );
}
