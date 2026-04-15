import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Csak a bejelentkezett user saját beküldött bingó-mező javaslatai.
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }

  const rows = await prisma.bingoItem.findMany({
    where: { submittedByUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      text: true,
      reviewStatus: true,
      active: true,
      createdAt: true,
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    text: r.text,
    reviewStatus: r.reviewStatus,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ items });
}
