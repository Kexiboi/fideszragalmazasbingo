import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Regisztráció",
  robots: { index: false, follow: false },
};

export default function RegisztracioPage(): React.ReactElement {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 py-12">
      <RegisterForm />
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Főoldal
      </Link>
    </main>
  );
}
