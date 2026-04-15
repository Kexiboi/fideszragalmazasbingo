import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CELL_COUNT, resolveCells } from "@/lib/bingo-card-server";

type RouteParams = { params: Promise<{ token: string }> };

/**
 * Nyilvános, csak olvasható nézet megosztott kártyához (bejelentkezés nélkül).
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "Érvénytelen link." }, { status: 400 });
  }

  const card = await prisma.bingoCard.findFirst({
    where: { shareToken: token },
    select: {
      title: true,
      cellIds: true,
      markedIndices: true,
    },
  });

  if (!card || card.cellIds.length < CELL_COUNT) {
    return NextResponse.json({ error: "A megosztott kártya nem található." }, { status: 404 });
  }

  const cells = await resolveCells(card.cellIds);

  return NextResponse.json({
    card: {
      title: card.title,
      cells,
      markedIndices: card.markedIndices,
    },
  });
}
