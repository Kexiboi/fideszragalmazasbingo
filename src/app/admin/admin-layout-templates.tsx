"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/components/app-modal";

export type LayoutTemplateAdminRow = {
  id: string;
  title: string;
  reviewStatus: "PENDING" | "APPROVED";
  submittedByEmail: string | null;
  activeInRandomDeal: boolean;
  cellCount: number;
  createdAt: string;
};

export function AdminLayoutTemplatesSection(): React.ReactElement {
  const [items, setItems] = useState<LayoutTemplateAdminRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    const res = await fetch("/api/bingo-layout-templates");
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as { items?: LayoutTemplateAdminRow[] };
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function patchAction(
    id: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/bingo-layout-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  const pending = items.filter((i) => i.reviewStatus === "PENDING");
  const approved = items.filter((i) => i.reviewStatus === "APPROVED");

  return (
    <section className="space-y-4">
      <ConfirmModal
        open={rejectId !== null}
        onClose={() => setRejectId(null)}
        title="Javaslat elutasítása"
        message="Biztosan törlöd ezt a kártyajavaslatot? Nem kerül jóváhagyásra."
        confirmLabel="Elutasítás"
        cancelLabel="Mégse"
        variant="danger"
        onConfirm={() => {
          const id = rejectId;
          if (id) {
            void patchAction(id, { action: "reject" });
          }
        }}
      />

      <h2 className="text-lg font-semibold text-white">Teljes kártya-javaslatok (5×5 minták)</h2>
      <p className="text-sm text-zinc-500">
        Jóváhagyáskor 25 „háttér” mező jön létre (nem a közös poolban). A minta bekapcsolható a
        véletlen <strong>minta-kiosztásba</strong>.
      </p>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-amber-200/90">Függőben</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-600">Nincs függő kártyajavaslat.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-100">{t.title}</p>
                  {t.submittedByEmail ? (
                    <p className="text-xs text-zinc-500">beküldte: {t.submittedByEmail}</p>
                  ) : null}
                  <p className="text-xs text-zinc-600">{t.createdAt}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => {
                      void patchAction(t.id, { action: "approve" });
                    }}
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    Jóváhagyás
                  </button>
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => setRejectId(t.id)}
                    className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Elutasítás
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-emerald-200/90">Jóváhagyott minták</h3>
        {approved.length === 0 ? (
          <p className="text-sm text-zinc-600">Még nincs jóváhagyott minta.</p>
        ) : (
          <ul className="space-y-2">
            {approved.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-100">{t.title}</p>
                  <p className="text-xs text-zinc-500">
                    {t.cellCount} cella ·{" "}
                    {t.activeInRandomDeal ? "aktív a minta-kiosztásban" : "kikapcsolva"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={t.activeInRandomDeal}
                    disabled={busyId === t.id || t.cellCount !== 25}
                    onChange={(ev) => {
                      void patchAction(t.id, {
                        action: "setActiveInRandomDeal",
                        value: ev.target.checked,
                      });
                    }}
                  />
                  véletlen minta-kiosztásban
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
