import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CELL_COUNT } from "@/lib/bingo-card-server";
import { parseProposedCells } from "@/lib/layout-proposal";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Admin: jóváhagyás (25 BingoItem létrehozása, poolon kívül), elutasítás, minta ki/be.
 */
export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("action" in body)) {
    return NextResponse.json({ error: "Hiányzik az action." }, { status: 400 });
  }

  const action = (body as { action: unknown }).action;

  if (action === "approve") {
    const t = await prisma.bingoLayoutTemplate.findUnique({ where: { id } });
    if (!t || t.reviewStatus !== "PENDING") {
      return NextResponse.json({ error: "Nem jóváhagyható tétel." }, { status: 400 });
    }
    const texts = parseProposedCells(t.proposedTexts);
    if (!texts) {
      return NextResponse.json({ error: "Hiányzó vagy hibás javasolt mezők." }, { status: 400 });
    }

    const maxOrder = await prisma.bingoItem.aggregate({ _max: { sortOrder: true } });
    let sortOrder = maxOrder._max.sortOrder ?? 0;

    await prisma.$transaction(async (tx) => {
      const cellIds: string[] = [];
      for (const text of texts) {
        sortOrder += 1;
        const item = await tx.bingoItem.create({
          data: {
            text,
            sortOrder,
            active: false,
            reviewStatus: "APPROVED",
            submittedByUserId: null,
          },
        });
        cellIds.push(item.id);
      }
      await tx.bingoLayoutTemplate.update({
        where: { id },
        data: {
          reviewStatus: "APPROVED",
          proposedTexts: Prisma.DbNull,
          cellIds,
          activeInRandomDeal: true,
        },
      });
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await prisma.bingoLayoutTemplate.deleteMany({
      where: { id, reviewStatus: "PENDING" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "setActiveInRandomDeal") {
    const t = await prisma.bingoLayoutTemplate.findUnique({ where: { id } });
    if (!t || t.reviewStatus !== "APPROVED" || t.cellIds.length !== CELL_COUNT) {
      return NextResponse.json({ error: "Csak jóváhagyott, teljes minta kapcsolható." }, { status: 400 });
    }
    const v = (body as { value?: unknown }).value;
    if (typeof v !== "boolean") {
      return NextResponse.json({ error: "A value boolean legyen." }, { status: 400 });
    }
    await prisma.bingoLayoutTemplate.update({
      where: { id },
      data: { activeInRandomDeal: v },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ismeretlen action." }, { status: 400 });
}
