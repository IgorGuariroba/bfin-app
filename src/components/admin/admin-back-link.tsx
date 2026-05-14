import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminBackLink({ href = "/admin", label = "Voltar" }: { href?: string; label?: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
      <Link href={href}>
        <ChevronLeft size={16} />
        {label}
      </Link>
    </Button>
  );
}
