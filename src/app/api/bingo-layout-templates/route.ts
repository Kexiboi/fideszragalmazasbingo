import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LAYOUT_TITLE_MAX, parseProposedCells } from "@/lib/layout-proposal";

type AdminTemplateRow = {
  id: string;
  title: string;
  reviewStatus: "PENDING" | "APPROVED";
  submittedByEmail: string | null;
  activeInRandomDeal: boolean;
  cellCount: number;
  createdAt: string;
};

/**
 * Admin: összes kártya-minta (jóváhagyáshoz).
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });
  }

  const rows = await prisma.bingoLayoutTemplate.findMany({
    orderBy: [{ reviewStatus: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      reviewStatus: true,
      activeInRandomDeal: true,
      cellIds: true,
      createdAt: true,
      submittedBy: { select: { email: true } },
    },
  });

  const items: AdminTemplateRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    reviewStatus: r.reviewStatus,
    submittedByEmail: r.submittedBy?.email ?? null,
    activeInRandomDeal: r.activeInRandomDeal,
    cellCount: r.cellIds.length,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ items });
}

/**
 * Új teljes kártya-javaslat (25 mező + név).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Érvénytelen JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("title" in body) || !("cells" in body)) {
    return NextResponse.json({ error: "Hiányzik a név vagy a 25 mező." }, { status: 400 });
  }

  const titleRaw = (body as { title: unknown }).title;
  if (typeof titleRaw !== "string") {
    return NextResponse.json({ error: "A név szöveg legyen." }, { status: 400 });
  }
  const title = titleRaw.trim();
  if (title.length === 0 || title.length > LAYOUT_TITLE_MAX) {
    return NextResponse.json(
      { error: `A név 1–${LAYOUT_TITLE_MAX} karakter legyen.` },
      { status: 400 },
    );
  }

  const cells = parseProposedCells((body as { cells: unknown }).cells);
  if (!cells) {
    return NextResponse.json(
      { error: "Pontosan 25 nem üres mező kell, egyenként max. 280 karakter." },
      { status: 400 },
    );
  }

  const created = await prisma.bingoLayoutTemplate.create({
    data: {
      title,
      reviewStatus: "PENDING",
      submittedByUserId: session.user.id,
      proposedTexts: cells,
      cellIds: [],
      activeInRandomDeal: false,
    },
    select: { id: true, title: true, reviewStatus: true },
  });

  return NextResponse.json(
    {
      template: created,
      message:
        "Kártyajavaslat elküldve. Az admin jóváhagyása után kerülhet be a „véletlen minta” kiosztások közé.",
    },
    { status: 201 },
  );
}
