"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useCallback, useState } from "react";

export type AdminItem = {
  id: string;
  text: string;
  active: boolean;
  sortOrder: number;
};

export function AdminPanel({ initialItems }: { initialItems: AdminItem[] }): React.ReactElement {
  const [items, setItems] = useState<AdminItem[]>(initialItems);
  const [newText, setNewText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  async function patchItem(id: string, patch: Partial<Pick<AdminItem, "text" | "active" | "sortOrder">>): Promise<void> {
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
    if (!window.confirm("Biztosan törlöd ezt a mezőt?")) {
      return;
    }
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

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bingó mezők</h1>
          <p className="text-sm text-zinc-500">
            {items.filter((i) => i.active).length} aktív / {items.length} összesen
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

      <form
        onSubmit={(e) => {
          void addItem(e);
        }}
        className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-400">
          Új mező szövege
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
          Hozzáadás
        </button>
      </form>
      {formError ? <p className="text-sm text-red-400">{formError}</p> : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-2">
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
              </div>
            </div>
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => {
                void removeItem(item.id);
              }}
              className="shrink-0 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm text-red-200 hover:bg-red-900/50 disabled:opacity-50"
            >
              Törlés
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
