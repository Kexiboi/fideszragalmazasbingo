import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// @ts-expect-error -- next-auth@5: a default export bundler alatt nem mindig „callable” típusú (toolchain).
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Jelszó", type: "password" },
      },
      authorize: async (credentials) => {
        const { authorizeCredentials } = await import("@/lib/auth-credentials");
        return authorizeCredentials(
          credentials as Record<"email" | "password", string> | undefined,
        );
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/bejelentkezes",
  },
  callbacks: {
    jwt: async ({ token, user }: { token: JWT; user?: User | null }) => {
      if (user?.id) {
        token.sub = user.id;
      }
      if (user?.email) {
        token.email = user.email;
      }
      if (user && "role" in user && typeof user.role === "string") {
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }: { session: Session; token: JWT }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        if (token.email) {
          session.user.email = token.email as string;
        }
        if (token.role === "USER" || token.role === "ADMIN") {
          session.user.role = token.role;
        }
      }
      return session;
    },
  },
});
