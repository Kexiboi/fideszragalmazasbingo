import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Saját beküldött kártya-minták (állapot).
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }

  const rows = await prisma.bingoLayoutTemplate.findMany({
    where: { submittedByUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      reviewStatus: true,
      activeInRandomDeal: true,
      cellIds: true,
      createdAt: true,
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    reviewStatus: r.reviewStatus,
    activeInRandomDeal: r.activeInRandomDeal,
    ready: r.cellIds.length === 25,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ items });
}
