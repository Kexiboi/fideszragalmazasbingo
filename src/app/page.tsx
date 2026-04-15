import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage(): Promise<React.ReactElement> {
  const session = await auth();

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(234, 88, 12, 0.35), transparent), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(225, 29, 72, 0.2), transparent)",
        }}
      />
      <div className="relative z-10 max-w-2xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-orange-400/90">
          Meme / szatíra
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Rágalmazás-bingó
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-zinc-400">
          Regisztrálj, lépj be, és töltsd a saját 5×5 kártyádat – a pipák a fiókodhoz tartoznak, nem
          csak ehhez a böngészőhöz. A mezőket továbbra is bővítheted adminban.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {session ? (
            <Link
              href="/jatek"
              className="inline-flex min-w-[200px] items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-900/30 transition hover:brightness-110 active:scale-[0.98]"
            >
              Bingó megnyitása
            </Link>
          ) : (
            <>
              <Link
                href="/regisztracio"
                className="inline-flex min-w-[200px] items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-900/30 transition hover:brightness-110 active:scale-[0.98]"
              >
                Regisztráció
              </Link>
              <Link
                href="/bejelentkezes"
                className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-zinc-600 bg-zinc-900/50 px-8 py-3.5 text-base font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800/50"
              >
                Belépés
              </Link>
            </>
          )}
          {session?.user.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-zinc-600 bg-zinc-900/50 px-8 py-3.5 text-base font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800/50"
            >
              Admin
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
