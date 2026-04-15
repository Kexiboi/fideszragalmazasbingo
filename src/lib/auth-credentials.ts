import bcrypt from "bcryptjs";
import type { User } from "next-auth";
import { prisma } from "@/lib/db";

type CredentialsInput = Record<"email" | "password", string> | undefined;

export async function authorizeCredentials(credentials: CredentialsInput): Promise<User | null> {
  const email = credentials?.email;
  const password = credentials?.password;
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }
  const role = user.role === "ADMIN" ? "ADMIN" : "USER";
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    role,
  };
}
