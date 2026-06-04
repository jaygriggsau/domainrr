"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/domains";

interface Result {
  domainName: string;
  tld?: string;
  purchasable?: boolean;
  premium?: boolean;
  purchasePrice?: number;
}

export function DomainSearch({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    const handle = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/domains/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Search failed.");
          setResults([]);
        } else {
          setError(null);
          setResults(data.results ?? []);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Search failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(handle);
  }, [query]);

  async function claim(domainName: string) {
    if (!signedIn) {
      router.push(`/login?from=/dashboard`);
      return;
    }
    setClaiming(domainName);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainName }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/dashboard/domains/${domainName}`);
      } else {
        setError(data.error ?? "Could not add domain.");
      }
    } finally {
      setClaiming(null);
    }
  }

  return (
    <div className="w-full">
      <div className="relative">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a domain…"
          className="w-full rounded-xl border border-border bg-card px-5 py-4 text-lg outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {loading && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-muted">
            searching…
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {results.map((r) => (
            <li
              key={r.domainName}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <span className="truncate font-mono text-base">
                  {r.domainName}
                </span>
                {r.premium && (
                  <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-500">
                    premium
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-4">
                {r.purchasable ? (
                  <>
                    <span className="text-sm text-muted">
                      {formatPrice(r.purchasePrice)}
                      <span className="text-xs">/yr</span>
                    </span>
                    <button
                      onClick={() => claim(r.domainName)}
                      disabled={claiming === r.domainName}
                      className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {claiming === r.domainName ? "Adding…" : "Get it"}
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-muted">Taken</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
