import { BottomNav } from "@/components/layout/bottom-nav";
import { AddModalProvider } from "@/lib/add-modal-context";
import { QuickAddModal } from "@/components/transactions/quick-add-modal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AddModalProvider>
      <div className="flex min-h-full flex-col bg-canvas">
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
        <QuickAddModal />
      </div>
    </AddModalProvider>
  );
}
