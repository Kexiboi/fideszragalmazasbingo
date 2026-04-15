import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

function isAdminSession(role: string | undefined): boolean {
  return role === "ADMIN";
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }
  if (!isAdminSession(session.user.role)) {
    return NextResponse.json({ error: "Csak admin módosíthat." }, { status: 403 });
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
    reviewStatus?: unknown;
  };

  const data: {
    text?: string;
    active?: boolean;
    sortOrder?: number;
    reviewStatus?: "PENDING" | "APPROVED";
  } = {};

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
  if ("reviewStatus" in b) {
    if (b.reviewStatus !== "PENDING" && b.reviewStatus !== "APPROVED") {
      return NextResponse.json({ error: "Érvénytelen reviewStatus." }, { status: 400 });
    }
    data.reviewStatus = b.reviewStatus;
    if (b.reviewStatus === "APPROVED") {
      data.active = true;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nincs módosítandó mező." }, { status: 400 });
  }

  try {
    const item = await prisma.bingoItem.update({
      where: { id },
      data,
      select: {
        id: true,
        text: true,
        active: true,
        sortOrder: true,
        reviewStatus: true,
        submittedBy: { select: { email: true } },
      },
    });
    return NextResponse.json({
      item: {
        id: item.id,
        text: item.text,
        active: item.active,
        sortOrder: item.sortOrder,
        reviewStatus: item.reviewStatus,
        submittedByEmail: item.submittedBy?.email ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Elem nem található." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }
  if (!isAdminSession(session.user.role)) {
    return NextResponse.json({ error: "Csak admin törölhet." }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.bingoItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Elem nem található." }, { status: 404 });
  }
}
