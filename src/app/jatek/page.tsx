import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BingoBoard } from "./bingo-board";

export const metadata: Metadata = {
  title: "Bingó",
  description: "Saját 5×5 kiosztás – állapot mentve a fiókodhoz.",
};

export default function JatekPage(): React.ReactElement {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="space-y-3">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition hover:text-orange-400"
        >
          ← Főoldal
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Rágalmazás-bingó</h1>
        <p className="max-w-2xl text-zinc-400">
          A <strong>kiosztás</strong> egy mentett 5×5 rács (sorrenddel). Az <strong>új kiosztás</strong> gomb
          véletlen 25 mezőt húz a közös poolból — egyenként admin által jóváhagyott szövegekből. Új szöveget a
          poolba:{" "}
          <Link href="/javaslat" className="text-orange-400 underline-offset-4 hover:underline">
            Mező javaslat
          </Link>
          , állapot:{" "}
          <Link href="/javaslataim" className="text-orange-400 underline-offset-4 hover:underline">
            Javaslataim
          </Link>
          . Mentett kiosztások listája:{" "}
          <Link href="/kiosztasaim" className="text-orange-400 underline-offset-4 hover:underline">
            Kiosztásaim
          </Link>
          . <strong>Megosztás</strong> csak mentett kiosztás után (a rács alatti gombok).
        </p>
      </header>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center text-zinc-400">
            Betöltés…
          </div>
        }
      >
        <BingoBoard />
      </Suspense>
    </main>
  );
}
