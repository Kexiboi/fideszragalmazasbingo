"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ConfirmModal } from "@/components/app-modal";
import { AdminLayoutTemplatesSection } from "./admin-layout-templates";

export type AdminItem = {
  id: string;
  text: string;
  active: boolean;
  sortOrder: number;
  reviewStatus: "PENDING" | "APPROVED";
  submittedByEmail: string | null;
};

export function AdminPanel({ initialItems }: { initialItems: AdminItem[] }): React.ReactElement {
  const [items, setItems] = useState<AdminItem[]>(initialItems);
  const [newText, setNewText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    const res = await fetch("/api/bingo-items?activeOnly=false");
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as { items?: AdminItem[] };
    setItems(data.items ?? []);
  }, []);

  async function addItem(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFormError(null);
    const text = newText.trim();
    if (!text) {
      setFormError("Írj be szöveget.");
      return;
    }
    const res = await fetch("/api/bingo-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      setFormError(err.error ?? "Mentés sikertelen.");
      return;
    }
    setNewText("");
    await refresh();
  }

  async function patchItem(
    id: string,
    patch: Partial<
      Pick<AdminItem, "text" | "active" | "sortOrder"> & { reviewStatus: "PENDING" | "APPROVED" }
    >,
  ): Promise<void> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bingo-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        await refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(id: string): Promise<void> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bingo-items/${id}`, { method: "DELETE" });
      if (res.ok) {
        await refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  const approvedInPlay = items.filter((i) => i.reviewStatus === "APPROVED" && i.active).length;
  const pendingCount = items.filter((i) => i.reviewStatus === "PENDING").length;
  const pendingItems = items.filter((i) => i.reviewStatus === "PENDING");
  const publishedItems = items.filter((i) => i.reviewStatus === "APPROVED");

  function renderItemRow(item: AdminItem): React.ReactElement {
    const isPending = item.reviewStatus === "PENDING";
    return (
      <li
        key={item.id}
        className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isPending ? (
              <span className="rounded-md bg-amber-600/30 px-2 py-0.5 font-medium text-amber-100">
                Jóváhagyásra vár
              </span>
            ) : (
              <span className="rounded-md bg-emerald-900/40 px-2 py-0.5 font-medium text-emerald-200">
                Közzétéve
              </span>
            )}
            {item.submittedByEmail ? (
              <span className="text-zinc-500">beküldte: {item.submittedByEmail}</span>
            ) : null}
          </div>
          <textarea
            defaultValue={item.text}
            disabled={busyId === item.id}
            onBlur={(ev) => {
              const next = ev.target.value.trim();
              if (next && next !== item.text) {
                void patchItem(item.id, { text: next });
              }
            }}
            rows={2}
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50"
          />
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            <span>sorrend: {item.sortOrder}</span>
            {!isPending ? (
              <label className="flex items-center gap-2 text-zinc-400">
                <input
                  type="checkbox"
                  checked={item.active}
                  disabled={busyId === item.id}
                  onChange={(ev) => {
                    void patchItem(item.id, { active: ev.target.checked });
                  }}
                />
                aktív a bingóban
              </label>
            ) : (
              <span className="text-zinc-600">jóváhagyás után kapcsolható az „aktív” állapot</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {isPending ? (
            <>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => {
                  void patchItem(item.id, { reviewStatus: "APPROVED" });
                }}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                Jóváhagyás
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => setDeleteTargetId(item.id)}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
              >
                Elutasítás
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => setDeleteTargetId(item.id)}
              className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm text-red-200 hover:bg-red-900/50 disabled:opacity-50"
            >
              Törlés
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-10">
      <ConfirmModal
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        title="Mező törlése"
        message="Biztosan törlöd ezt a mezőt? Ha már kártyákon szerepelt, ott továbbra is látszani fog a szöveg, de új osztásokban nem."
        confirmLabel="Törlés"
        cancelLabel="Mégse"
        variant="danger"
        onConfirm={() => {
          const id = deleteTargetId;
          if (id) {
            void removeItem(id);
          }
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bingó mezők</h1>
          <p className="text-sm text-zinc-500">
            {approvedInPlay} közzétéve a játékban · {pendingCount} jóváhagyásra vár · {items.length}{" "}
            összesen
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/jatek"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Bingó megtekintése
          </Link>
          <button
            type="button"
            onClick={() => {
              void signOut({ callbackUrl: "/" });
            }}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            Kijelentkezés
          </button>
        </div>
      </div>

      <p className="rounded-xl border border-amber-900/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
        <strong>Egy mező</strong> a játék pooljába:{" "}
        <Link href="/javaslat" className="underline underline-offset-2">
          Javaslat
        </Link>{" "}
        vagy a bingó oldal. A játékosok <strong>új kiosztást</strong> a poolból kapnak; az alábbi{" "}
        <strong>kártyaminták</strong> opcionális admin-eszköz (ha bekapcsolsz egy mintát, külön logika szerint
        osztható — a publikus UI nem erre épül).
      </p>

      <AdminLayoutTemplatesSection />

      <form
        onSubmit={(e) => {
          void addItem(e);
        }}
        className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-400">
          Új mező (azonnal közzétéve)
          <input
            value={newText}
            onChange={(ev) => setNewText(ev.target.value)}
            placeholder="pl. …"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-orange-600 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-500"
        >
          Közzététel
        </button>
      </form>
      {formError ? <p className="text-sm text-red-400">{formError}</p> : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Játékos javaslatok · jóváhagyás</h2>
        {pendingItems.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-4 text-sm text-zinc-500">
            Nincs függőben lévő javaslat.
          </p>
        ) : (
          <ul className="space-y-3">{pendingItems.map((item) => renderItemRow(item))}</ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Közzétett mezők · szerkesztés</h2>
        {publishedItems.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-4 text-sm text-zinc-500">
            Még nincs közzétett mező.
          </p>
        ) : (
          <ul className="space-y-3">{publishedItems.map((item) => renderItemRow(item))}</ul>
        )}
      </section>
    </div>
  );
}
