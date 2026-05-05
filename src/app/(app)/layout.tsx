import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
