import type { Metadata } from "next";
import Link from "next/link";
import { SuggestForm } from "./suggest-form";

export const metadata: Metadata = {
  title: "Új mező javaslata",
  description: "Bingó mező beküldése admin jóváhagyásra.",
};

export default function JavaslatPage(): React.ReactElement {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-orange-400">
          ← Főoldal
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Új bingó-mező javaslata</h1>
      </header>
      <SuggestForm />
    </main>
  );
}
