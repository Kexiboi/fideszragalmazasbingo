import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  CELL_COUNT,
  dealCellIds,
  ensureActiveCardRef,
  loadActivePool,
  resolveCells,
} from "@/lib/bingo-card-server";
import { countDealTemplates, loadDealTemplates, pickRandomDealTemplate } from "@/lib/layout-template-deal";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, must-revalidate" };

type BingoCardSummary = {
  id: string;
  title: string | null;
  isFavorite: boolean;
  marksCount: number;
  layoutCommittedAt: string | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Nincs bejelentkezve." },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
  const userId = session.user.id;

  const pool = await loadActivePool();
  if (pool.length < CELL_COUNT) {
    return NextResponse.json(
      { error: "Nincs elég aktív mező.", poolSize: pool.length },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  await ensureActiveCardRef(userId);

  const templateDealCount = await countDealTemplates();

  let cards = await prisma.bingoCard.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      isFavorite: true,
      shareToken: true,
      layoutCommittedAt: true,
      markedIndices: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (cards.length === 0) {
    const cellIds = dealCellIds(pool);
    const created = await prisma.bingoCard.create({
      data: {
        userId,
        cellIds,
        markedIndices: [],
        title: null,
        isFavorite: false,
      },
      select: {
        id: true,
        title: true,
        isFavorite: true,
        shareToken: true,
        layoutCommittedAt: true,
        markedIndices: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { activeBingoCardId: created.id },
    });
    cards = [created];
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeBingoCardId: true },
  });

  const summaries: BingoCardSummary[] = cards.map((c) => ({
    id: c.id,
    title: c.title,
    isFavorite: c.isFavorite,
    marksCount: c.markedIndices.length,
    layoutCommittedAt: c.layoutCommittedAt?.toISOString() ?? null,
    shareToken: c.shareToken,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return NextResponse.json(
    {
      cards: summaries,
      activeCardId: user?.activeBingoCardId ?? null,
      templateDealCount,
    },
    { headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Nincs bejelentkezve." },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
  const userId = session.user.id;

  let title: string | null = null;
  let dealMode: "pool" | "template" = "pool";
  try {
    const body = await request.json();
    if (typeof body === "object" && body !== null && "title" in body) {
      const t = (body as { title: unknown }).title;
      if (t === null) {
        title = null;
      } else if (typeof t === "string") {
        const s = t.trim();
        title = s.length > 0 ? s.slice(0, 120) : null;
      }
    }
    if (typeof body === "object" && body !== null && "dealMode" in body) {
      const m = (body as { dealMode: unknown }).dealMode;
      if (m === "template") {
        dealMode = "template";
      }
    }
  } catch {
    /* üres body ok */
  }

  let cellIds: string[];

  if (dealMode === "template") {
    const templates = await loadDealTemplates();
    const picked = pickRandomDealTemplate(templates);
    if (!picked) {
      return NextResponse.json(
        { error: "Nincs jóváhagyott, kiosztásra bekapcsolt kártyaminta." },
        { status: 503 },
      );
    }
    cellIds = [...picked.cellIds];
  } else {
    const pool = await loadActivePool();
    if (pool.length < CELL_COUNT) {
      return NextResponse.json({ error: "Nincs elég aktív mező." }, { status: 503 });
    }
    cellIds = dealCellIds(pool);
  }

  try {
    const card = await prisma.bingoCard.create({
      data: {
        userId,
        cellIds,
        markedIndices: [],
        title,
        isFavorite: false,
        layoutCommittedAt: null,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { activeBingoCardId: card.id },
    });

    const cells = await resolveCells(card.cellIds);

    return NextResponse.json({
      card: {
        id: card.id,
        title: card.title,
        isFavorite: card.isFavorite,
        layoutCommittedAt: card.layoutCommittedAt?.toISOString() ?? null,
        shareToken: card.shareToken,
        cells,
        markedIndices: card.markedIndices,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Ismeretlen szerverhiba.";
    return NextResponse.json(
      { error: `Új kiosztás nem hozható létre: ${msg}` },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
