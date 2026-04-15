import { randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import { CELL_COUNT } from "@/lib/bingo-card-server";

export type DealTemplateRow = { id: string; cellIds: string[] };

/**
 * Jóváhagyott, kiosztásra bekapcsolt teljes kártya-minták (25 cella).
 */
export async function loadDealTemplates(): Promise<DealTemplateRow[]> {
  const rows = await prisma.bingoLayoutTemplate.findMany({
    where: {
      reviewStatus: "APPROVED",
      activeInRandomDeal: true,
    },
    select: { id: true, cellIds: true },
  });
  return rows.filter((r) => r.cellIds.length === CELL_COUNT);
}

export async function countDealTemplates(): Promise<number> {
  const list = await loadDealTemplates();
  return list.length;
}

export function pickRandomDealTemplate(templates: DealTemplateRow[]): DealTemplateRow | null {
  if (templates.length === 0) {
    return null;
  }
  const i = randomInt(templates.length);
  return templates[i] ?? null;
}
