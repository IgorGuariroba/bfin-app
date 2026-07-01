import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureSystemTags } from "@/lib/seed-system-tags";
import { isAdmin } from "@/lib/admin";
import { resolveClickId, uploadConversion } from "@/lib/google-ads";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await ensureSystemTags(user.id);

      // Atribuição de marketing (ADR-0010): grava o identificador de clique
      // capturado na entrada (cookies bfin_gclid/gbraid/wbraid, ver
      // GclidCapture) para que a 1ª ativação pro deste User reporte a Conversão,
      // e reporta o Sinal de cadastro (secundário, sem valor) para dar volume
      // ao Smart Bidding. Nunca quebra o cadastro.
      try {
        const store = await cookies();
        const data = {
          gclid: store.get("bfin_gclid")?.value,
          gbraid: store.get("bfin_gbraid")?.value,
          wbraid: store.get("bfin_wbraid")?.value,
        };
        const clickId = resolveClickId(data);
        if (!clickId) return;

        await prisma.user.update({ where: { id: user.id }, data });

        const signupActionId = process.env.GOOGLE_ADS_SIGNUP_CONVERSION_ACTION_ID;
        if (signupActionId) {
          const result = await uploadConversion({
            clickId,
            occurredAt: new Date(),
            conversionActionId: signupActionId,
          });
          if (!result.ok && result.reason === "error") {
            console.error("[google-ads] sinal de cadastro falhou:", result.error);
          }
        }
      } catch (e) {
        console.error("[google-ads] falha na atribuição do cadastro:", e);
      }
    },
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnBlog = nextUrl.pathname === "/blog" || nextUrl.pathname.startsWith("/blog/");

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/saldos", nextUrl));
        return true;
      }

      if (isOnBlog) return true;

      // Proteger rotas (app) por padrão.
      // Futuras rotas públicas devem ser excluídas aqui ou via matcher do middleware.
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      token.isAdmin = isAdmin(token.email);
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      session.user.isAdmin = Boolean(token.isAdmin);
      return session;
    },
  },
});
