import { signOut } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
      className="w-full"
    >
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left shadow-sm transition-transform active:scale-95"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red/10 text-red">
          <LogOut size={20} />
        </div>
        <span className="font-semibold text-red">Sair da conta</span>
      </button>
    </form>
  );
}
