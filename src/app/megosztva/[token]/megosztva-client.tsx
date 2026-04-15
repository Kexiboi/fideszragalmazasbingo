"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SharedBingoView } from "../shared-bingo-view";

type BingoCell = { id: string; text: string };

type CardPayload = {
  title: string | null;
  cells: BingoCell[];
  markedIndices: number[];
};

export function MegosztvaClient({ token }: { token: string }): React.ReactElement {
  const [card, setCard] = useState<CardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/shared-bingo/${encodeURIComponent(token)}`);
        const data = (await res.json()) as { error?: string; card?: CardPayload };
        if (!res.ok) {
          if (!cancelled) {
            setError(data.error ?? "Nem sikerült betölteni.");
            setCard(null);
          }
          return;
        }
        if (!cancelled && data.card) {
          setCard(data.card);
        }
      } catch {
        if (!cancelled) {
          setError("Hálózati hiba.");
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
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-zinc-400">
        Betöltés…
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/25 px-6 py-8 text-center text-amber-100">
        {error ?? "Ismeretlen hiba."}
        <div className="mt-4">
          <Link href="/" className="text-orange-400 underline underline-offset-4">
            Főoldal
          </Link>
        </div>
      </div>
    );
  }

  return <SharedBingoView title={card.title} cells={card.cells} markedIndices={card.markedIndices} />;
}
