import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Javaslataim",
  description: "Saját beküldött bingó-mező javaslataid állapota.",
};

export const dynamic = "force-dynamic";

export default async function JavaslataimPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/bejelentkezes?callbackUrl=/javaslataim");
  }

  const items = await prisma.bingoItem.findMany({
    where: { submittedByUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      text: true,
      reviewStatus: true,
      active: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <Link href="/jatek" className="text-sm text-zinc-500 transition hover:text-orange-400">
          ← Bingó
        </Link>
        <h1 className="text-3xl font-bold text-white">Beküldött javaslataim</h1>
        <p className="text-sm text-zinc-400">
          Csak a saját szövegeid látszanak. Ha az admin jóváhagyja és bekapcsolja, a javaslat bekerül a
          közös mezők közé, és új kártyákon is megjelenhet.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-zinc-400">
          Még nincs beküldött javaslatod. A{" "}
          <Link href="/jatek" className="text-orange-400 underline underline-offset-2">
            bingó
          </Link>{" "}
          oldalon vagy a{" "}
          <Link href="/javaslat" className="text-orange-400 underline underline-offset-2">
            mező javaslat
          </Link>{" "}
          űrlapon küldhetsz szöveget.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const inPlay = item.reviewStatus === "APPROVED" && item.active;
            const approvedWaiting = item.reviewStatus === "APPROVED" && !item.active;
            return (
              <li
                key={item.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 text-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {item.reviewStatus === "PENDING" ? (
                    <span className="rounded-md bg-amber-600/35 px-2 py-0.5 text-xs font-medium text-amber-100">
                      Admin döntésre vár
                    </span>
                  ) : null}
                  {approvedWaiting ? (
                    <span className="rounded-md bg-sky-900/40 px-2 py-0.5 text-xs font-medium text-sky-200">
                      Jóváhagyva, még nem aktív a játékban
                    </span>
                  ) : null}
                  {inPlay ? (
                    <span className="rounded-md bg-emerald-900/45 px-2 py-0.5 text-xs font-medium text-emerald-200">
                      Benne van a bingóban
                    </span>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-zinc-200">{item.text}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Beküldve:{" "}
                  {item.createdAt.toLocaleString("hu-HU", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
