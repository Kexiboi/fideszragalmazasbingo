"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { shuffleInPlace } from "@/lib/shuffle";

type BingoCell = {
  id: string;
  text: string;
};

const GRID_SIZE = 5;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;

function loadMarks(key: string): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveMarks(key: string, marks: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...marks]));
}

export function BingoBoard(): React.ReactElement {
  const [pool, setPool] = useState<BingoCell[]>([]);
  const [card, setCard] = useState<BingoCell[]>([]);
  const [cardKey, setCardKey] = useState<string>("");
  const [marks, setMarks] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const storageKey = useMemo(() => `bingo-marks:${cardKey}`, [cardKey]);

  useEffect(() => {
    if (!cardKey) {
      return;
    }
    setMarks(loadMarks(storageKey));
  }, [storageKey, cardKey]);

  useEffect(() => {
    let cancelled = false;
    (async (): Promise<void> => {
      try {
        const res = await fetch("/api/bingo-items");
        if (!res.ok) {
          throw new Error("Nem sikerült betölteni a mezőket.");
        }
        const data = (await res.json()) as {
          items?: { id: string; text: string }[];
        };
        const items = data.items ?? [];
        if (cancelled) {
          return;
        }
        setPool(items.map((i) => ({ id: i.id, text: i.text })));
        setLoadError(null);
      } catch {
        if (!cancelled) {
          setLoadError("Hálózati hiba – próbáld újra.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dealNewCard = useCallback((): void => {
    if (pool.length < CELL_COUNT) {
      return;
    }
    const shuffled = shuffleInPlace(pool);
    const next = shuffled.slice(0, CELL_COUNT);
    setCard(next);
    setCardKey(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    setMarks(new Set());
  }, [pool]);

  useEffect(() => {
    if (!loading && pool.length >= CELL_COUNT && card.length === 0) {
      dealNewCard();
    }
  }, [loading, pool, card.length, dealNewCard]);

  const toggleMark = useCallback(
    (id: string): void => {
      setMarks((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        saveMarks(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const rows = useMemo(() => {
    const r: BingoCell[][] = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      r.push(card.slice(y * GRID_SIZE, (y + 1) * GRID_SIZE));
    }
    return r;
  }, [card]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-400">
        Kártya kiosztása…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-6 py-8 text-center text-red-200">
        {loadError}
      </div>
    );
  }

  if (pool.length < CELL_COUNT) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 px-6 py-8 text-center text-amber-100">
        Legalább {CELL_COUNT} aktív mező kell a bingóhoz. Jelenleg {pool.length} van – adj hozzá az{" "}
        <Link href="/admin" className="underline decoration-amber-400/80 underline-offset-4">
          admin felületen
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-sm text-zinc-400">
          Kattints a mezőkre, ha „megtörtént” vagy ha csak ki akarod pipálni. A pipák ezen a készüléken
          maradnak (böngésző tárolás).
        </p>
        <button
          type="button"
          onClick={dealNewCard}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/40 transition hover:brightness-110 active:scale-[0.98]"
        >
          Új kártya
        </button>
      </div>

      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {rows.map((row) =>
          row.map((cell) => {
            const marked = marks.has(cell.id);
            return (
              <button
                key={cell.id}
                type="button"
                onClick={() => toggleMark(cell.id)}
                className={[
                  "flex min-h-[5.5rem] items-center justify-center rounded-xl border px-2 py-3 text-center text-xs font-medium leading-snug transition sm:min-h-[6.5rem] sm:px-3 sm:text-sm",
                  marked
                    ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-100 line-through decoration-emerald-400/80"
                    : "border-zinc-700/80 bg-zinc-900/60 text-zinc-100 hover:border-orange-500/50 hover:bg-zinc-800/80",
                ].join(" ")}
              >
                {cell.text}
              </button>
            );
          }),
        )}
      </div>

      <p className="text-center text-xs text-zinc-500">
        Pipák száma: {marks.size} / {CELL_COUNT}
      </p>
    </div>
  );
}
