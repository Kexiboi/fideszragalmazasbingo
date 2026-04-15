import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Belépés",
  robots: { index: false, follow: false },
};

export default function BejelentkezesPage(): React.ReactElement {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 py-12">
      <Suspense
        fallback={<div className="text-sm text-zinc-500">Űrlap betöltése…</div>}
      >
        <LoginForm />
      </Suspense>
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Főoldal
      </Link>
    </main>
  );
}
