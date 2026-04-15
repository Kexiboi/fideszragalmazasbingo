import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const MIN_PASSWORD = 8;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Hiányzó adatok." }, { status: 400 });
  }

  const { email: rawEmail, password: rawPassword, name: rawName } = body as Record<
    string,
    unknown
  >;

  if (typeof rawEmail !== "string" || typeof rawPassword !== "string") {
    return NextResponse.json({ error: "Email és jelszó kötelező." }, { status: 400 });
  }

  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword;
  const name =
    typeof rawName === "string" && rawName.trim().length > 0 ? rawName.trim() : null;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Érvénytelen email." }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `A jelszó legalább ${MIN_PASSWORD} karakter legyen.` },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ez az email már regisztrálva van." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "USER",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
