import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login"];
const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Não logado + rota protegida → login
  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logado + rota pública → saldos
  if (isPublic && hasSession) {
    return NextResponse.redirect(new URL("/saldos", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|sw\\.js|manifest\\.json|icons/|.*\\.png$).*)"],
};
