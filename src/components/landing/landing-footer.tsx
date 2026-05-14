import Image from "next/image";
import Link from "next/link";

const productLinks = [
  { href: "/#features", label: "Recursos" },
  { href: "/#faq", label: "FAQ" },
  { href: "/precos", label: "Preços" },
  { href: "/ajuda", label: "Ajuda" },
];

const companyLinks = [
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Image
              src="/icon.png"
              alt="bfin"
              width={20}
              height={20}
              className="rounded"
            />
            <span>© {new Date().getFullYear()} bfin · Beta no Brasil</span>
          </div>

          <div>
            <h4 className="mb-3 text-[13px] font-semibold text-ink">Produto</h4>
            <ul className="flex flex-col gap-2 text-[13px] text-muted">
              {productLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[13px] font-semibold text-ink">Empresa</h4>
            <ul className="flex flex-col gap-2 text-[13px] text-muted">
              {companyLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
