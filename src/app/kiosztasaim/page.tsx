import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Kiosztásaim",
  description: "Mentett 5×5 kiosztásaid és megosztási linkek.",
};

export const dynamic = "force-dynamic";

const CELL_TOTAL = 25;

async function getPublicOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) {
    return "";
  }
  return `${proto}://${host}`;
}

export default async function KiosztasaimPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/bejelentkezes?callbackUrl=/kiosztasaim");
  }

  const [user, origin] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        activeBingoCardId: true,
        bingoCards: {
          orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            title: true,
            isFavorite: true,
            shareToken: true,
            layoutCommittedAt: true,
            markedIndices: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }),
    getPublicOrigin(),
  ]);

  const cards = user?.bingoCards ?? [];
  const activeId = user?.activeBingoCardId ?? null;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <Link href="/jatek" className="text-sm text-zinc-500 transition hover:text-orange-400">
          ← Bingó
        </Link>
        <h1 className="text-3xl font-bold text-white">Kiosztásaim</h1>
        <p className="text-sm text-zinc-400">
          Minden sor egy mentett <strong>5×5 kiosztás</strong> (sorrenddel együtt): pipák, kedvenc, megosztási link.
          Az <strong>aktuálisan nézett</strong> kiosztást a bingó oldalon váltod.
        </p>
      </header>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-zinc-400">
          Még nincs mentett kiosztásod — nyiss{" "}
          <Link href="/jatek" className="text-orange-400 underline underline-offset-2">
            bingót
          </Link>
          , és kapsz egyet automatikusan.
        </p>
      ) : (
        <ul className="space-y-3">
          {cards.map((c) => {
            const sharePath = c.shareToken ? `/megosztva/${c.shareToken}` : null;
            const fullShare = origin && sharePath ? `${origin}${sharePath}` : sharePath;
            const marksCount = c.markedIndices.length;
            const committed = c.layoutCommittedAt !== null;
            return (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-200">
                    {c.isFavorite ? <span title="Kedvenc">★</span> : null}
                    <span className="font-medium">
                      {c.title && c.title.length > 0 ? c.title : "Névtelen kiosztás"}
                    </span>
                    {c.id === activeId ? (
                      <span className="rounded bg-orange-900/40 px-2 py-0.5 text-xs text-orange-200">
                        aktív a játékban
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Pipák: {marksCount} / {CELL_TOTAL}
                    {marksCount >= CELL_TOTAL ? (
                      <span className="ml-2 text-emerald-500">· kész bingó</span>
                    ) : null}
                    {committed ? (
                      <span className="ml-2 text-sky-400">· megosztható (mentve)</span>
                    ) : (
                      <span className="ml-2 text-zinc-600">· megosztás: mentsd el a bingóban</span>
                    )}
                  </p>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md sm:flex-none sm:items-end">
                  <Link
                    href={`/jatek?karty=${encodeURIComponent(c.id)}`}
                    className="inline-flex justify-center rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-center text-sm font-semibold text-white hover:brightness-110"
                  >
                    Megnyitás játékban
                  </Link>
                  {fullShare ? (
                    <span className="break-all text-xs text-zinc-400">{fullShare}</span>
                  ) : (
                    <span className="text-xs text-zinc-600">
                      {committed
                        ? "Megosztási link: a bingóban „Megosztási link”."
                        : "Előbb a bingóban: „Kiosztás mentése megosztáshoz”, aztán link."}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
