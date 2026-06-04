"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  user: { email: string; name?: string | null } | null;
}

export function SiteHeader({ user }: Props) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white">
            ◎
          </span>
          <span>Domainrr</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-muted hover:text-foreground">
                Dashboard
              </Link>
              <button
                onClick={signOut}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-card"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted hover:text-foreground">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-foreground px-3 py-1.5 font-medium text-background hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
