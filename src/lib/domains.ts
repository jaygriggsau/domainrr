/** Shared helpers for turning a search box query into domains to check. */

export const POPULAR_TLDS = [
  "com",
  "io",
  "dev",
  "app",
  "co",
  "net",
  "org",
  "ai",
  "xyz",
  "me",
] as const;

const LABEL_RE = /^[a-z0-9-]+$/;

/** Strip protocol/path/whitespace and lowercase a raw search query. */
export function normalizeQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, "");
}

/** Is this a syntactically valid single domain label (e.g. "myapp")? */
export function isValidLabel(label: string): boolean {
  return (
    label.length > 0 &&
    label.length <= 63 &&
    LABEL_RE.test(label) &&
    !label.startsWith("-") &&
    !label.endsWith("-")
  );
}

/**
 * Build the list of fully-qualified domain names to check for a query.
 * If the user typed a dotted name (e.g. "foo.io") we check that exact name
 * plus popular alternatives for the same SLD. Otherwise we append popular TLDs.
 */
export function buildCandidates(query: string): string[] {
  const q = normalizeQuery(query);
  if (!q) return [];

  const dotIndex = q.indexOf(".");
  const sld = dotIndex === -1 ? q : q.slice(0, dotIndex);
  if (!isValidLabel(sld)) return [];

  const candidates = new Set<string>();

  if (dotIndex !== -1) {
    candidates.add(q); // exact name the user typed
  }

  for (const tld of POPULAR_TLDS) {
    candidates.add(`${sld}.${tld}`);
  }

  // name.com checkAvailability accepts up to 50 names.
  return Array.from(candidates).slice(0, 50);
}

export function formatPrice(price?: number): string {
  if (price === undefined || price === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}
