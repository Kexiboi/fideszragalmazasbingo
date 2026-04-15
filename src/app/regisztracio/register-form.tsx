"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Regisztráció sikertelen.");
        return;
      }
      const sign = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (sign?.error) {
        router.push("/bejelentkezes");
        return;
      }
      router.push("/jatek");
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
      <h1 className="text-xl font-semibold text-white">Regisztráció</h1>
      <p className="text-sm text-zinc-500">
        Már van fiókod?{" "}
        <Link href="/bejelentkezes" className="text-orange-400 hover:underline">
          Belépés
        </Link>
      </p>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Megjelenített név (opcionális)
        <input
          name="name"
          type="text"
          autoComplete="nickname"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/60"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/60"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Jelszó (min. 8 karakter)
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
          minLength={8}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/60"
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-60"
      >
        {pending ? "Fiók létrehozása…" : "Fiók létrehozása"}
      </button>
    </form>
  );
}
