import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("activeOnly") !== "false";

  const items = await prisma.bingoItem.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, text: true, active: true, sortOrder: true },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("text" in body)) {
    return NextResponse.json({ error: "Hiányzik a szöveg." }, { status: 400 });
  }

  const text = (body as { text: unknown }).text;
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "A szöveg nem lehet üres." }, { status: 400 });
  }

  const maxOrder = await prisma.bingoItem.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;

  const item = await prisma.bingoItem.create({
    data: { text: text.trim(), sortOrder },
    select: { id: true, text: true, active: true, sortOrder: true },
  });

  return NextResponse.json({ item }, { status: 201 });
}
