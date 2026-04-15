import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("activeOnly") !== "false";

  if (!activeOnly && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });
  }

  const where = activeOnly
    ? { active: true, reviewStatus: "APPROVED" as const }
    : undefined;

  const rows = await prisma.bingoItem.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      text: true,
      active: true,
      sortOrder: true,
      reviewStatus: true,
      submittedBy: { select: { email: true } },
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    text: r.text,
    active: r.active,
    sortOrder: r.sortOrder,
    reviewStatus: r.reviewStatus,
    submittedByEmail: r.submittedBy?.email ?? null,
  }));

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

  const trimmed = text.trim();
  if (trimmed.length > 500) {
    return NextResponse.json({ error: "Legfeljebb 500 karakter." }, { status: 400 });
  }

  const maxOrder = await prisma.bingoItem.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;

  const isAdmin = session.user.role === "ADMIN";

  if (isAdmin) {
    const item = await prisma.bingoItem.create({
      data: {
        text: trimmed,
        sortOrder,
        active: true,
        reviewStatus: "APPROVED",
        submittedByUserId: null,
      },
      select: {
        id: true,
        text: true,
        active: true,
        sortOrder: true,
        reviewStatus: true,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  }

  const item = await prisma.bingoItem.create({
    data: {
      text: trimmed,
      sortOrder,
      active: false,
      reviewStatus: "PENDING",
      submittedByUserId: session.user.id,
    },
    select: {
      id: true,
      text: true,
      active: true,
      sortOrder: true,
      reviewStatus: true,
    },
  });

  return NextResponse.json(
    {
      item,
      message:
        "Köszönjük a javaslatot! Az admin ellenőrzi; jóváhagyás után kerül be a bingóba. Addig nem bukkan fel új kártyaosztáskor.",
    },
    { status: 201 },
  );
}
