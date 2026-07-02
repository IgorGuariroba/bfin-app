import { signOut } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
      className="w-full"
    >
      <Button
        type="submit"
        variant="ghost"
        className="flex w-full h-auto items-center gap-3 rounded-[14px] p-4 justify-start active:scale-95 transition-transform hover:bg-feedback-negative-surface"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-error shrink-0">
          <LogOut size={20} />
        </div>
        <span className="text-[16px] font-semibold leading-[1.25] text-error">Sair da conta</span>
      </Button>
    </form>
  );
}
