import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/login",
  "/convite",
  "/api/health",
  "/api/cron/baixa-diaria",
  "/precos",
  "/lp",
  "/ajuda",
  "/sobre",
  "/contato",
  "/privacidade",
  "/termos",
];
const publicExact = ["/"];
const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    publicExact.includes(pathname) ||
    publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthRedirectRoute = pathname.startsWith("/login");
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Não logado + rota protegida → login
  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logado + /login → destino. Honra ?callbackUrl (caminho interno) para não
  // furar o funil da LP de campanha, que manda logados de anúncio direto ao
  // checkout (/assinar). Sem callbackUrl válido → /saldos. (landing em / fica
  // visível mesmo logado pra preview; page.tsx já redireciona logados.)
  if (isAuthRedirectRoute && hasSession) {
    const cb = request.nextUrl.searchParams.get("callbackUrl");
    const dest = cb && cb.startsWith("/") && !cb.startsWith("//") ? cb : "/saldos";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|sw\\.js|manifest\\.json|icons/|.*\\.(?:png|jpe?g|webp|svg|gif|ico)$).*)"],
};
