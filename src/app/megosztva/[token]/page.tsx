import type { Metadata } from "next";
import Link from "next/link";
import { MegosztvaClient } from "./megosztva-client";

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  return {
    title: "Megosztott bingó",
    description: `Megosztott kártya (${token.slice(0, 8)}…)`,
    robots: { index: false, follow: false },
  };
}

export default async function MegosztvaPage({ params }: PageProps): Promise<React.ReactElement> {
  const { token } = await params;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-2 text-center sm:text-left">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-orange-400">
          ← Főoldal
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Megosztott bingókártya</h1>
        <p className="text-sm text-zinc-500">
          Ezt a linket küldte valaki – a pipák állapota is látszik, de itt nem szerkeszthető.
        </p>
      </header>
      <MegosztvaClient token={token} />
    </main>
  );
}
