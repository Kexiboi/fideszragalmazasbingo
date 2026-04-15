import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { AdminPanel } from "./admin-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage(): Promise<React.ReactElement> {
  const raw = await prisma.bingoItem.findMany({
    orderBy: [{ reviewStatus: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      text: true,
      active: true,
      sortOrder: true,
      reviewStatus: true,
      submittedBy: { select: { email: true } },
    },
  });

  const initialItems = raw.map((i) => ({
    id: i.id,
    text: i.text,
    active: i.active,
    sortOrder: i.sortOrder,
    reviewStatus: i.reviewStatus,
    submittedByEmail: i.submittedBy?.email ?? null,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <AdminPanel initialItems={initialItems} />
    </main>
  );
}
