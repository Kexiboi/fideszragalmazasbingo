"use client";

import { useMemo } from "react";

type BingoCell = { id: string; text: string };

const GRID_SIZE = 5;

type SharedBingoViewProps = {
  title: string | null;
  cells: BingoCell[];
  markedIndices: number[];
};

export function SharedBingoView({
  title,
  cells,
  markedIndices,
}: SharedBingoViewProps): React.ReactElement {
  const markedSet = useMemo(() => new Set(markedIndices), [markedIndices]);

  const rows = useMemo(() => {
    const r: BingoCell[][] = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      r.push(cells.slice(y * GRID_SIZE, (y + 1) * GRID_SIZE));
    }
    return r;
  }, [cells]);

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-zinc-500">
        Megosztott kártya{title ? ` · ${title}` : ""} · csak megtekintés
      </p>
      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {rows.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const index = rowIdx * GRID_SIZE + colIdx;
            const marked = markedSet.has(index);
            return (
              <div
                key={`${cell.id}-${index}`}
                className={[
                  "flex min-h-[5.5rem] items-center justify-center rounded-xl border px-2 py-3 text-center text-xs font-medium leading-snug sm:min-h-[6.5rem] sm:px-3 sm:text-sm",
                  marked
                    ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-100 line-through decoration-emerald-400/80"
                    : "border-zinc-700/80 bg-zinc-900/60 text-zinc-100",
                ].join(" ")}
              >
                {cell.text}
              </div>
            );
          }),
        )}
      </div>
      <p className="text-center text-xs text-zinc-500">
        Pipák: {markedSet.size} / {GRID_SIZE * GRID_SIZE}
      </p>
    </div>
  );
}
