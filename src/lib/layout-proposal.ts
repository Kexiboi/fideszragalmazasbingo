export const LAYOUT_CELL_TEXT_MAX = 280;
export const LAYOUT_TITLE_MAX = 120;

/**
 * 25 nem üres, trimmelt szöveg; max. hossz ellenőrizve.
 */
export function parseProposedCells(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length !== 25) {
    return null;
  }
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string") {
      return null;
    }
    const t = x.trim();
    if (t.length === 0 || t.length > LAYOUT_CELL_TEXT_MAX) {
      return null;
    }
    out.push(t);
  }
  return out;
}
