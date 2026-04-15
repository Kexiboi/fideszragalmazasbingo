"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppModal, ConfirmModal } from "@/components/app-modal";

type BingoCell = {
  id: string;
  text: string;
};

const GRID_SIZE = 5;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;

type CardSummary = {
  id: string;
  title: string | null;
  isFavorite: boolean;
  marksCount: number;
  layoutCommittedAt: string | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
};

type CardPayload = {
  id: string;
  title: string | null;
  isFavorite: boolean;
  layoutCommittedAt: string | null;
  shareToken: string | null;
  cells: BingoCell[];
  markedIndices: number[];
};

function formatCardLabel(c: CardSummary): string {
  if (c.title && c.title.length > 0) {
    return c.isFavorite ? `★ ${c.title}` : c.title;
  }
  const d = new Date(c.createdAt);
  const label = d.toLocaleString("hu-HU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return c.isFavorite ? `★ Kiosztás · ${label}` : `Kiosztás · ${label}`;
}

/** Minden bingó API hívás — a böngésző ne tárolja a GET válaszokat (régi activeCardId → rossz rács újratöltéskor). */
async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, { cache: "no-store", ...init });
}

export function BingoBoard(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kartyParam = searchParams.get("karty");
  const appliedKartyRef = useRef<string | null>(null);
  /** Növelése érvényteleníti a háttérben futó „karty=” selectCard hívásokat (versenyhelyzet). */
  const layoutNavEpochRef = useRef(0);

  useEffect(() => {
    appliedKartyRef.current = null;
  }, [kartyParam]);

  const [cards, setCards] = useState<CardSummary[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [card, setCard] = useState<CardPayload | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [dealConfirmOpen, setDealConfirmOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [suggestInfoOpen, setSuggestInfoOpen] = useState(false);
  const [suggestInfoText, setSuggestInfoText] = useState("");
  const [winOpen, setWinOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const prevMarkCountRef = useRef<number | null>(null);
  const markedSet = useMemo(() => new Set(card?.markedIndices ?? []), [card?.markedIndices]);

  const refreshList = useCallback(async (): Promise<{
    cards: CardSummary[];
    activeCardId: string | null;
  } | null> => {
    const res = await apiFetch("/api/my-bingo");
    if (res.status === 401) {
      setLoadError("Jelentkezz be újra.");
      return null;
    }
    if (!res.ok) {
      const data = (await res.json()) as { error?: string; poolSize?: number };
      if (res.status === 503) {
        setLoadError(
          `Legalább ${CELL_COUNT} aktív mező kell. Jelenleg: ${data.poolSize ?? "?"}.`,
        );
        return null;
      }
      setLoadError(data.error ?? "Nem sikerült betölteni a listát.");
      return null;
    }
    const data = (await res.json()) as {
      cards?: CardSummary[];
      activeCardId?: string | null;
    };
    const nextCards = data.cards ?? [];
    const nextActive = data.activeCardId ?? null;
    setCards(nextCards);
    setActiveCardId(nextActive);
    setLoadError(null);
    return { cards: nextCards, activeCardId: nextActive };
  }, []);

  const loadCardById = useCallback(async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/my-bingo/${id}`);
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as { card?: CardPayload };
    if (data.card) {
      setCard(data.card);
      setTitleDraft(data.card.title ?? "");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async (): Promise<void> => {
      setLoading(true);
      try {
        const list = await refreshList();
        if (cancelled || !list) {
          return;
        }
        const targetId = list.activeCardId ?? list.cards[0]?.id ?? null;
        if (targetId) {
          await loadCardById(targetId);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshList, loadCardById]);

  useEffect(() => {
    prevMarkCountRef.current = null;
  }, [card?.id]);

  useEffect(() => {
    if (!card) {
      return;
    }
    const n = markedSet.size;
    const prev = prevMarkCountRef.current;
    if (prev === null) {
      prevMarkCountRef.current = n;
      return;
    }
    if (n === CELL_COUNT && prev < CELL_COUNT) {
      setWinOpen(true);
    }
    prevMarkCountRef.current = n;
  }, [card, markedSet.size]);

  const selectCard = useCallback(
    async (id: string): Promise<void> => {
      const myEpoch = layoutNavEpochRef.current;
      setBusy(true);
      try {
        const res = await apiFetch("/api/my-bingo/active", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: id }),
        });
        if (!res.ok) {
          return;
        }
        if (myEpoch !== layoutNavEpochRef.current) {
          return;
        }
        setActiveCardId(id);
        await loadCardById(id);
        if (myEpoch !== layoutNavEpochRef.current) {
          return;
        }
        await refreshList();
      } finally {
        setBusy(false);
      }
    },
    [loadCardById, refreshList],
  );

  useEffect(() => {
    if (loading || !kartyParam || cards.length === 0) {
      return;
    }
    if (!cards.some((c) => c.id === kartyParam)) {
      return;
    }
    if (appliedKartyRef.current === kartyParam) {
      return;
    }
    appliedKartyRef.current = kartyParam;
    if (kartyParam !== activeCardId) {
      void selectCard(kartyParam);
    }
  }, [loading, kartyParam, cards, activeCardId, selectCard]);

  const dealNewCard = useCallback(async (): Promise<void> => {
    layoutNavEpochRef.current += 1;
    setBusy(true);
    try {
      const res = await apiFetch("/api/my-bingo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealMode: "pool" }),
      });
      if (!res.ok) {
        let message = `Hiba (${res.status}).`;
        try {
          const errBody = (await res.json()) as { error?: string };
          if (errBody.error) {
            message = errBody.error;
          }
        } catch {
          /* üres / nem JSON válasz */
        }
        setLoadError(message);
        return;
      }
      const data = (await res.json()) as { card?: CardPayload };
      if (data.card) {
        const next = data.card;
        setCard(next);
        setTitleDraft(next.title ?? "");
        setActiveCardId(next.id);
        setLoadError(null);
        await refreshList();
        await loadCardById(next.id);
        router.replace("/jatek");
      }
    } finally {
      setBusy(false);
    }
  }, [refreshList, loadCardById, router]);

  const toggleMark = useCallback(
    async (index: number): Promise<void> => {
      if (!card?.id) {
        return;
      }
      setBusy(true);
      try {
        const res = await apiFetch(`/api/my-bingo/${card.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index }),
        });
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { card?: CardPayload };
        if (data.card) {
          setCard(data.card);
          await refreshList();
        }
      } finally {
        setBusy(false);
      }
    },
    [card?.id, refreshList],
  );

  const toggleFavorite = useCallback(async (): Promise<void> => {
    if (!card?.id) {
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(`/api/my-bingo/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !card.isFavorite }),
      });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as { card?: CardPayload };
      if (data.card) {
        setCard(data.card);
        await refreshList();
      }
    } finally {
      setBusy(false);
    }
  }, [card?.id, card?.isFavorite, refreshList]);

  const saveTitle = useCallback(async (): Promise<void> => {
    if (!card?.id) {
      return;
    }
    const nextTitle = titleDraft.trim();
    const current = card.title ?? "";
    if (nextTitle === current) {
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(`/api/my-bingo/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle.length > 0 ? nextTitle : null }),
      });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as { card?: CardPayload };
      if (data.card) {
        setCard(data.card);
        setTitleDraft(data.card.title ?? "");
        await refreshList();
      }
    } finally {
      setBusy(false);
    }
  }, [card?.id, card?.title, titleDraft, refreshList]);

  const deleteCard = useCallback(async (): Promise<void> => {
    if (!card?.id) {
      return;
    }
    layoutNavEpochRef.current += 1;
    const removedId = card.id;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/my-bingo/${removedId}`, { method: "DELETE" });
      if (!res.ok) {
        return;
      }
      const list = await refreshList();
      const nextId = list?.activeCardId ?? list?.cards[0]?.id ?? null;
      if (nextId) {
        await loadCardById(nextId);
        setActiveCardId(nextId);
      } else {
        setCard(null);
        setTitleDraft("");
        setActiveCardId(null);
      }
      if (kartyParam === removedId) {
        router.replace("/jatek");
      }
    } finally {
      setBusy(false);
    }
  }, [card?.id, refreshList, loadCardById, kartyParam, router]);

  const commitLayoutForShare = useCallback(async (): Promise<void> => {
    if (!card?.id) {
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(`/api/my-bingo/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitLayout: true }),
      });
      const data = (await res.json()) as { card?: CardPayload; error?: string };
      if (!res.ok) {
        setSuggestInfoText(data.error ?? "Mentés sikertelen.");
        setSuggestInfoOpen(true);
        return;
      }
      if (data.card) {
        setCard(data.card);
        await refreshList();
        setSuggestInfoText(
          "Kiosztás elmentve megosztáshoz. Most már kérhetsz megosztási linket.",
        );
        setSuggestInfoOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }, [card?.id, refreshList]);

  const openShareModal = useCallback(async (): Promise<void> => {
    if (!card?.id) {
      return;
    }
    if (!card.layoutCommittedAt) {
      setSuggestInfoText(
        "Megosztáshoz előbb mentsd el ezt a kiosztást: „Kiosztás mentése megosztáshoz”.",
      );
      setSuggestInfoOpen(true);
      return;
    }
    setBusy(true);
    setShareCopied(false);
    try {
      const res = await apiFetch(`/api/my-bingo/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ensureShareToken: true }),
      });
      const data = (await res.json()) as { card?: CardPayload; error?: string };
      if (!res.ok || !data.card?.shareToken) {
        setSuggestInfoText(data.error ?? "Megosztási link nem készíthető.");
        setSuggestInfoOpen(true);
        return;
      }
      setCard(data.card);
      await refreshList();
      const url = `${window.location.origin}/megosztva/${data.card.shareToken}`;
      setShareUrl(url);
      setShareOpen(true);
    } finally {
      setBusy(false);
    }
  }, [card?.id, card?.layoutCommittedAt, refreshList]);

  const copyShareUrl = useCallback(async (): Promise<void> => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
    } catch {
      setShareCopied(false);
    }
  }, [shareUrl]);

  const rows = useMemo(() => {
    const cells = card?.cells ?? [];
    const r: BingoCell[][] = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      r.push(cells.slice(y * GRID_SIZE, (y + 1) * GRID_SIZE));
    }
    return r;
  }, [card?.cells]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-400">
        Kiosztások betöltése…
      </div>
    );
  }

  if (loadError) {
    const needsAdmin = loadError.includes("aktív mező");
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 px-6 py-8 text-center text-amber-100">
        {loadError}
        {needsAdmin ? (
          <>
            {" "}
            <Link href="/admin" className="underline decoration-amber-400/80 underline-offset-4">
              Admin
            </Link>
            .
          </>
        ) : null}
      </div>
    );
  }

  if (!card || card.cells.length < CELL_COUNT) {
    return (
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900/40 px-6 py-8 text-center text-zinc-400">
        Nincs megjeleníthető kiosztás.{" "}
        <button
          type="button"
          onClick={() => {
            void refreshList().then((l) => {
              const id = l?.activeCardId ?? l?.cards[0]?.id;
              if (id) {
                void loadCardById(id);
              }
            });
          }}
          className="text-orange-400 underline"
        >
          Frissítés
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ConfirmModal
        open={dealConfirmOpen}
        onClose={() => setDealConfirmOpen(false)}
        title="Új kiosztás?"
        message="Új, véletlenszerű 5×5 rácsot kapsz: 25 mezőt a közös poolból, amit az admin jóváhagyott és közzétett egyenként. A sorrend és a konkrét mezők a kiosztás pillanatában dőlnek el — nem te rakod össze. A mostani kiosztásod megmarad (pipákkal), ehhez egy új mentett kiosztás jön létre."
        confirmLabel="Igen, új kiosztás"
        cancelLabel="Mégse"
        onConfirm={() => {
          void dealNewCard();
        }}
      />

      <ConfirmModal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Kiosztás törlése"
        message="Biztosan törlöd ezt a mentett kiosztást? (A rács: 25 mező ebben a sorrendben.) A pipák és a megosztási link is vele mennek."
        confirmLabel="Törlés"
        cancelLabel="Mégse"
        variant="danger"
        onConfirm={() => {
          void deleteCard();
        }}
      />

      <AppModal
        open={suggestInfoOpen}
        onClose={() => setSuggestInfoOpen(false)}
        title="Üzenet"
        footer={
          <button
            type="button"
            onClick={() => setSuggestInfoOpen(false)}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-600"
          >
            Rendben
          </button>
        }
      >
        <p>{suggestInfoText}</p>
        <p className="mt-3 text-xs text-zinc-500">
          Mezőjavaslat állapota:{" "}
          <Link href="/javaslataim" className="text-orange-400 underline underline-offset-2">
            Javaslataim
          </Link>
          .
        </p>
      </AppModal>

      <AppModal
        open={winOpen}
        onClose={() => setWinOpen(false)}
        title="Bingó!"
        footer={
          <>
            <button
              type="button"
              onClick={() => setWinOpen(false)}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Csak nézem még
            </button>
            <button
              type="button"
              onClick={() => {
                setWinOpen(false);
                setDealConfirmOpen(true);
              }}
              className="rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Kérek új kiosztást
            </button>
          </>
        }
      >
        <p>
          Hát ez most már tényleg <strong>telitalálat</strong> – a hivatalos narratíva szerint persze
          semmi sem számít, de neked igen.
        </p>
        <p className="mt-3 text-zinc-400">
          Ha van még kedved, kérhetsz egy <strong>új kiosztást</strong> a közös poolból — ez a teljes
          5×5 megmarad a listádban.
        </p>
      </AppModal>

      <AppModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Bingód megosztása"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShareOpen(false)}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Bezárás
            </button>
            <button
              type="button"
              onClick={() => {
                void copyShareUrl();
              }}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
            >
              {shareCopied ? "Másolva!" : "Link másolása"}
            </button>
          </>
        }
      >
        <p className="text-xs text-zinc-400">
          Másold ki a linket (gomb alatt), és küldd el pl. üzenetben vagy posztban. Bejelentkezés nélkül
          is megnyithatják: ugyanaz a 25 mező és a pipáid látszanak, de nem tudják szerkeszteni.
        </p>
        <label className="mt-3 block text-xs text-zinc-500">
          URL
          <input
            readOnly
            value={shareUrl}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200"
          />
        </label>
      </AppModal>

      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Kiválasztott kiosztás
            </span>
            <select
              value={activeCardId ?? ""}
              disabled={busy || cards.length === 0}
              onChange={(ev) => {
                const id = ev.target.value;
                if (id) {
                  void selectCard(id);
                }
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatCardLabel(c)} ({c.marksCount}/{CELL_COUNT})
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/kiosztasaim"
              className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Kiosztásaim
            </Link>
            <Link
              href="/javaslataim"
              className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Javaslataim
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Megjegyzés / név (opcionális)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={titleDraft}
              onChange={(ev) => setTitleDraft(ev.target.value)}
              onBlur={() => {
                void saveTitle();
              }}
              placeholder="pl. Esti vita, mém, baráti körben…"
              maxLength={120}
              disabled={busy}
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void toggleFavorite();
              }}
              title={card.isFavorite ? "Kedvenc levétele" : "Kedvencnek jelölés"}
              className="rounded-xl border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-950/50 disabled:opacity-40"
            >
              {card.isFavorite ? "★ Kedvenc" : "☆ Kedvenc"}
            </button>
            <button
              type="button"
              disabled={busy || !card.layoutCommittedAt}
              title={
                card.layoutCommittedAt
                  ? "Megosztási link kérése"
                  : "Előbb: „Kiosztás mentése megosztáshoz”"
              }
              onClick={() => {
                void openShareModal();
              }}
              className="rounded-xl border border-sky-800/60 bg-sky-950/30 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-950/45 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Megosztási link
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {card.layoutCommittedAt ? (
              <span className="text-xs text-emerald-400/90">
                ✓ Kiosztás elmentve — megosztható
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void commitLayoutForShare();
                }}
                className="rounded-lg border border-emerald-800/50 bg-emerald-950/25 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-950/40 disabled:opacity-50"
              >
                Kiosztás mentése megosztáshoz
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 px-3 py-3 text-xs text-emerald-100/90">
          <p className="font-medium text-emerald-200">Új mező a közös poolba</p>
          <p className="mt-1 text-emerald-100/80">
            Egy rövid szöveget javasolsz; ha az admin jóváhagyja, bekerül a sok közé. Az{" "}
            <strong>új kiosztás</strong> ezekből az egyenként jóváhagyott mezőkből rak össze véletlenül
            25-öt. Állapot:{" "}
            <Link href="/javaslataim" className="text-orange-300 underline underline-offset-2">
              Javaslataim
            </Link>
            .
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/javaslat"
              className="rounded-lg bg-emerald-700/80 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Mező beküldése
            </Link>
            <Link
              href="/javaslataim"
              className="rounded-lg border border-emerald-600/50 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-950/40"
            >
              Javaslataim
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-orange-500/25 bg-orange-950/20 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1 text-xs text-orange-100/85">
            <p>
              <strong className="text-orange-200">Kiosztás:</strong> ez a 5×5 rács — melyik mező hol
              van, abban a sorrendben. <strong>Új kiosztás</strong> = új véletlen 25 a poolból.{" "}
              <strong>Törlés</strong> = ez a mentett kiosztás megy a kukába.
            </p>
            <p>
              <strong className="text-orange-200">Megosztás:</strong> csak{" "}
              <strong>mentett kiosztás</strong> után (gomb fent).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setDealConfirmOpen(true)}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/40 transition hover:brightness-110 disabled:opacity-50"
            >
              Új kiosztás
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDeleteOpen(true)}
              className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-200 hover:bg-red-950/50 disabled:opacity-40"
            >
              Kiosztás törlése
            </button>
          </div>
        </div>

      </div>

      <p className="max-w-xl text-sm text-zinc-400">
        Több <strong>kiosztást</strong> is elmenthetsz (mindegyik egy-egy 5×5). A{" "}
        <Link href="/kiosztasaim" className="text-orange-400 underline underline-offset-2">
          Kiosztásaim
        </Link>{" "}
        oldalon látod őket és a megosztási linkeket.
      </p>

      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {rows.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const index = rowIdx * GRID_SIZE + colIdx;
            const marked = markedSet.has(index);
            return (
              <button
                key={`${cell.id}-${index}`}
                type="button"
                disabled={busy}
                onClick={() => {
                  void toggleMark(index);
                }}
                className={[
                  "flex min-h-[5.5rem] items-center justify-center rounded-xl border px-2 py-3 text-center text-xs font-medium leading-snug transition sm:min-h-[6.5rem] sm:px-3 sm:text-sm disabled:opacity-60",
                  marked
                    ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-100 line-through decoration-emerald-400/80"
                    : "border-zinc-700/80 bg-zinc-900/60 text-zinc-100 hover:border-orange-500/50 hover:bg-zinc-800/80",
                ].join(" ")}
              >
                {cell.text}
              </button>
            );
          }),
        )}
      </div>

      <p className="text-center text-xs text-zinc-500">
        Pipák száma: {markedSet.size} / {CELL_COUNT}
      </p>
    </div>
  );
}
