declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: "USER" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: "USER" | "ADMIN";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    email?: string;
    role?: "USER" | "ADMIN";
  }
}
