import Image from "next/image";
import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="bfin"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="text-[22px] font-bold tracking-tight text-rausch">
            bfin
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className="text-base font-semibold text-ink hover:underline underline-offset-4"
          >
            Recursos
          </Link>
          <Link
            href="/blog"
            className="text-base font-semibold text-ink hover:underline underline-offset-4"
          >
            Blog
          </Link>
          <Link
            href="/#faq"
            className="text-base font-semibold text-ink hover:underline underline-offset-4"
          >
            FAQ
          </Link>
        </nav>
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-rausch px-6 text-base font-medium text-white transition-colors hover:bg-rausch-active"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
