import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin bejelentkezés",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage(): React.ReactElement {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 py-12">
      <LoginForm />
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Vissza a főoldalra
      </Link>
    </main>
  );
}
