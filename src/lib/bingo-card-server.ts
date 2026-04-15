import { prisma } from "@/lib/db";
import { shuffleInPlace } from "@/lib/shuffle";

export const CELL_COUNT = 25;

export async function loadActivePool(): Promise<{ id: string; text: string }[]> {
  return prisma.bingoItem.findMany({
    where: { active: true, reviewStatus: "APPROVED" },
    select: { id: true, text: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function dealCellIds(items: { id: string }[]): string[] {
  const shuffled = shuffleInPlace([...items]);
  return shuffled.slice(0, CELL_COUNT).map((i) => i.id);
}

export async function resolveCells(cellIds: string[]): Promise<{ id: string; text: string }[]> {
  const items = await prisma.bingoItem.findMany({
    where: { id: { in: cellIds } },
    select: { id: true, text: true },
  });
  const map = new Map(items.map((i) => [i.id, i.text]));
  return cellIds.map((id) => ({
    id,
    text: map.get(id) ?? "(törölve / ismeretlen)",
  }));
}

export async function ensureActiveCardRef(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeBingoCardId: true },
  });
  if (user?.activeBingoCardId) {
    const still = await prisma.bingoCard.findFirst({
      where: { id: user.activeBingoCardId, userId },
    });
    if (still) {
      return;
    }
  }
  const fallback = await prisma.bingoCard.findFirst({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
  await prisma.user.update({
    where: { id: userId },
    data: { activeBingoCardId: fallback?.id ?? null },
  });
}
