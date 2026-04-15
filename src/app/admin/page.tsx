import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { AdminPanel } from "./admin-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage(): Promise<React.ReactElement> {
  const items = await prisma.bingoItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, text: true, active: true, sortOrder: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <AdminPanel initialItems={items} />
    </main>
  );
}
