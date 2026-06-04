import { NextResponse } from "next/server";
import { buildCandidates, normalizeQuery, POPULAR_TLDS } from "@/lib/domains";
import {
  checkAvailability,
  isNameComConfigured,
  NameComError,
  type DomainSearchResult,
} from "@/lib/namecom";

const TLD_ORDER = new Map<string, number>(
  POPULAR_TLDS.map((tld, i) => [tld, i]),
);

function rank(result: DomainSearchResult, query: string): number {
  // Exact typed match floats to the very top.
  if (result.domainName === query) return -1000;
  const tldIndex = TLD_ORDER.get(result.tld ?? "") ?? 99;
  // Available domains before unavailable ones, then by popular-TLD order.
  return (result.purchasable ? 0 : 1000) + tldIndex;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";
  const query = normalizeQuery(raw);
  const candidates = buildCandidates(raw);

  if (candidates.length === 0) {
    return NextResponse.json({ query, results: [] });
  }

  if (!isNameComConfigured()) {
    return NextResponse.json(
      {
        error:
          "Domain search is not configured yet. Add your name.com credentials (NAMECOM_USERNAME / NAMECOM_TOKEN) to .env.",
      },
      { status: 503 },
    );
  }

  try {
    const results = await checkAvailability(candidates);
    results.sort((a, b) => rank(a, query) - rank(b, query));
    return NextResponse.json({ query, results });
  } catch (err) {
    if (err instanceof NameComError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Something went wrong searching for domains." },
      { status: 500 },
    );
  }
}
