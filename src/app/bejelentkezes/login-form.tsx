"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function safeCallback(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/jatek";
  }
  return raw;
}

export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Hibás email vagy jelszó.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl"
    >
      <h1 className="text-xl font-semibold text-white">Belépés</h1>
      <p className="text-sm text-zinc-500">
        A bingóhoz regisztráció szükséges.{" "}
        <Link href="/regisztracio" className="text-orange-400 hover:underline">
          Fiók létrehozása
        </Link>
      </p>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-orange-500/0 transition focus:ring-2 focus:ring-orange-500/60"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Jelszó
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-orange-500/0 transition focus:ring-2 focus:ring-orange-500/60"
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-60"
      >
        {pending ? "Belépés…" : "Belépés"}
      </button>
    </form>
  );
}
