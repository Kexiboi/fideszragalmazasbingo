"use client";

import Link from "next/link";
import { useState } from "react";
import { AppModal } from "@/components/app-modal";

export function SuggestForm(): React.ReactElement {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    const t = text.trim();
    if (!t) {
      setError("Írj be egy javasolt mezőszöveget.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/bingo-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Küldés sikertelen.");
        return;
      }
      setText("");
      setSuccessText(
        data.message ??
          "Köszönjük! Az admin jóváhagyása után kerül be a bingóba – addig nem használjuk új kártyákban.",
      );
      setSuccessOpen(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <AppModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Beküldve"
        footer={
          <button
            type="button"
            onClick={() => setSuccessOpen(false)}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
          >
            Rendben
          </button>
        }
      >
        <p>{successText}</p>
        <p className="mt-3 text-xs text-zinc-500">
          Saját javaslataidat a{" "}
          <Link href="/javaslataim" className="text-orange-400 underline underline-offset-2">
            Javaslataim
          </Link>{" "}
          oldalon követheted.
        </p>
      </AppModal>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="mb-4 text-sm leading-relaxed text-zinc-400">
          Írj be egy rövid, bingó-mezőnek való mondatot. <strong>Nem jelenik meg azonnal</strong> a
          játékban: előbb egy admin megnézi és jóváhagyja. Ha kész, bekerül a közös mezők közé, és
          onnantól kiosztható új kártyákon is.
        </p>
        <form
          onSubmit={(e) => {
            void onSubmit(e);
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Javasolt mező szövege (max. 500 karakter)
            <textarea
              value={text}
              onChange={(ev) => setText(ev.target.value)}
              required
              maxLength={500}
              rows={4}
              placeholder="pl. …"
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60"
          >
            {pending ? "Küldés…" : "Javaslat beküldése"}
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-zinc-500">
        <Link href="/jatek" className="text-orange-400 hover:underline">
          ← Vissza a bingóhoz
        </Link>
      </p>
    </div>
  );
}
