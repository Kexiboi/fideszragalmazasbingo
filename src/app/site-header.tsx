import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "./actions/auth";

export async function SiteHeader(): Promise<React.ReactElement> {
  const session = await auth();

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-zinc-100 hover:text-orange-400">
          Rágalmazás-bingó
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          {session ? (
            <>
              <span className="max-w-[200px] truncate text-zinc-500" title={session.user.email}>
                {session.user.email}
              </span>
              <Link href="/jatek" className="hover:text-orange-400">
                Bingó
              </Link>
              <Link href="/kiosztasaim" className="hover:text-orange-400">
                Kiosztásaim
              </Link>
              <Link href="/javaslat" className="hover:text-orange-400">
                Mező javaslat
              </Link>
              <Link href="/javaslataim" className="hover:text-orange-400">
                Javaslataim
              </Link>
              {session.user.role === "ADMIN" ? (
                <Link href="/admin" className="hover:text-orange-400">
                  Admin
                </Link>
              ) : null}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-300 hover:bg-zinc-800"
                >
                  Kijelentkezés
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/bejelentkezes" className="hover:text-orange-400">
                Belépés
              </Link>
              <Link href="/regisztracio" className="hover:text-orange-400">
                Regisztráció
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
