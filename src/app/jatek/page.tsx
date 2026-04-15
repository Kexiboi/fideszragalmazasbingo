import type { Metadata } from "next";
import Link from "next/link";
import { BingoBoard } from "./bingo-board";

export const metadata: Metadata = {
  title: "Bingó",
  description: "Véletlenszerű 5×5 kártya a narratívákból.",
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
          Öt sor, öt oszlop – a cellák a nyilvános kampánybeszédből ismert sablonok. Kattintgass, nézd,
          oszd meg.
        </p>
      </header>
      <BingoBoard />
    </main>
  );
}
