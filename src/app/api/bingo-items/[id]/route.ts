import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Üres kérés." }, { status: 400 });
  }

  const b = body as {
    text?: unknown;
    active?: unknown;
    sortOrder?: unknown;
  };

  const data: { text?: string; active?: boolean; sortOrder?: number } = {};

  if ("text" in b) {
    if (typeof b.text !== "string" || b.text.trim().length === 0) {
      return NextResponse.json({ error: "A szöveg nem lehet üres." }, { status: 400 });
    }
    data.text = b.text.trim();
  }
  if ("active" in b) {
    if (typeof b.active !== "boolean") {
      return NextResponse.json({ error: "Az active mező boolean kell legyen." }, { status: 400 });
    }
    data.active = b.active;
  }
  if ("sortOrder" in b) {
    if (typeof b.sortOrder !== "number" || !Number.isFinite(b.sortOrder)) {
      return NextResponse.json({ error: "A sortOrder szám kell legyen." }, { status: 400 });
    }
    data.sortOrder = Math.round(b.sortOrder);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nincs módosítandó mező." }, { status: 400 });
  }

  try {
    const item = await prisma.bingoItem.update({
      where: { id },
      data,
      select: { id: true, text: true, active: true, sortOrder: true },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Elem nem található." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.bingoItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Elem nem található." }, { status: 404 });
  }
}
