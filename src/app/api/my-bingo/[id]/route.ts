import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CELL_COUNT, resolveCells } from "@/lib/bingo-card-server";
import { createShareToken } from "@/lib/share-token";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, must-revalidate" };

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Nincs bejelentkezve." },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
  const userId = session.user.id;
  const { id } = await params;

  const card = await prisma.bingoCard.findFirst({
    where: { id, userId },
  });
  if (!card) {
    return NextResponse.json(
      { error: "Kártya nem található." },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const cells = await resolveCells(card.cellIds);

  return NextResponse.json(
    {
      card: {
        id: card.id,
        title: card.title,
        isFavorite: card.isFavorite,
        layoutCommittedAt: card.layoutCommittedAt?.toISOString() ?? null,
        shareToken: card.shareToken,
        cells,
        markedIndices: card.markedIndices,
      },
    },
    { headers: NO_STORE_HEADERS },
  );
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: cardId } = await params;

  const card = await prisma.bingoCard.findFirst({
    where: { id: cardId, userId },
  });
  if (!card) {
    return NextResponse.json({ error: "Kártya nem található." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Üres kérés." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const data: {
    markedIndices?: number[];
    title?: string | null;
    isFavorite?: boolean;
    layoutCommittedAt?: Date;
  } = {};
  let shareTokenEnsured = false;

  if ("index" in b) {
    const index = b.index;
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= CELL_COUNT) {
      return NextResponse.json({ error: "Érvénytelen index." }, { status: 400 });
    }
    const set = new Set(card.markedIndices);
    if (set.has(index)) {
      set.delete(index);
    } else {
      set.add(index);
    }
    data.markedIndices = [...set].sort((a, c) => a - c);
  }

  if ("title" in b) {
    const t = b.title;
    if (t === null) {
      data.title = null;
    } else if (typeof t === "string") {
      const s = t.trim();
      data.title = s.length > 0 ? s.slice(0, 120) : null;
    } else {
      return NextResponse.json({ error: "A title szöveg vagy null legyen." }, { status: 400 });
    }
  }

  if ("isFavorite" in b) {
    if (typeof b.isFavorite !== "boolean") {
      return NextResponse.json({ error: "Az isFavorite boolean legyen." }, { status: 400 });
    }
    data.isFavorite = b.isFavorite;
  }

  const committingNow = "commitLayout" in b && b.commitLayout === true;
  if (committingNow) {
    data.layoutCommittedAt = new Date();
  }

  if ("ensureShareToken" in b && b.ensureShareToken === true) {
    shareTokenEnsured = true;
    if (!card.layoutCommittedAt && !card.shareToken && !committingNow) {
      return NextResponse.json(
        {
          error:
            "Megosztáshoz előbb mentsd el a kiosztást: „Kiosztás mentése megosztáshoz”.",
        },
        { status: 403 },
      );
    }
    if (!card.shareToken) {
      let assigned = false;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = createShareToken();
        try {
          await prisma.bingoCard.update({
            where: { id: cardId },
            data: { shareToken: candidate },
          });
          assigned = true;
          break;
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            continue;
          }
          throw e;
        }
      }
      if (!assigned) {
        return NextResponse.json({ error: "Megosztási link létrehozása sikertelen." }, { status: 500 });
      }
    }
  }

  if (Object.keys(data).length === 0 && !shareTokenEnsured) {
    return NextResponse.json({ error: "Nincs módosítandó mező." }, { status: 400 });
  }

  const updated =
    Object.keys(data).length > 0
      ? await prisma.bingoCard.update({
          where: { id: cardId },
          data,
        })
      : await prisma.bingoCard.findFirstOrThrow({
          where: { id: cardId, userId },
        });

  const cells = await resolveCells(updated.cellIds);

  return NextResponse.json({
    card: {
      id: updated.id,
      title: updated.title,
      isFavorite: updated.isFavorite,
      layoutCommittedAt: updated.layoutCommittedAt?.toISOString() ?? null,
      shareToken: updated.shareToken,
      cells,
      markedIndices: updated.markedIndices,
    },
  });
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: cardId } = await params;

  const card = await prisma.bingoCard.findFirst({
    where: { id: cardId, userId },
  });
  if (!card) {
    return NextResponse.json({ error: "Kártya nem található." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeBingoCardId: true },
  });

  await prisma.bingoCard.delete({ where: { id: cardId } });

  if (user?.activeBingoCardId === cardId) {
    const nextCard = await prisma.bingoCard.findFirst({
      where: { userId },
      orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    });
    await prisma.user.update({
      where: { id: userId },
      data: { activeBingoCardId: nextCard?.id ?? null },
    });
  }

  return NextResponse.json({ ok: true });
}
