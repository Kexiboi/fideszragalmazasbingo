import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ensureActiveCardRef } from "@/lib/bingo-card-server";

export async function PUT(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("cardId" in body)) {
    return NextResponse.json({ error: "Hiányzik a cardId." }, { status: 400 });
  }

  const cardId = (body as { cardId: unknown }).cardId;
  if (typeof cardId !== "string" || cardId.length === 0) {
    return NextResponse.json({ error: "Érvénytelen cardId." }, { status: 400 });
  }

  const owned = await prisma.bingoCard.findFirst({
    where: { id: cardId, userId },
  });
  if (!owned) {
    return NextResponse.json({ error: "Kártya nem található." }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { activeBingoCardId: cardId },
  });

  await ensureActiveCardRef(userId);

  return NextResponse.json({ ok: true, activeCardId: cardId });
}
