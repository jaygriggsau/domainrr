/**
 * Minimal client for the name.com v4 reseller API.
 *
 * Auth is HTTP Basic with `username:token`. In the dev/sandbox environment the
 * username is your name.com username with `-test` appended. Configure via env:
 *   NAMECOM_API_URL, NAMECOM_USERNAME, NAMECOM_TOKEN
 *
 * Docs: https://www.name.com/api-docs (v4)
 */

const API_URL = process.env.NAMECOM_API_URL ?? "https://api.dev.name.com";
const USERNAME = process.env.NAMECOM_USERNAME ?? "";
const TOKEN = process.env.NAMECOM_TOKEN ?? "";

export class NameComError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "NameComError";
  }
}

export function isNameComConfigured(): boolean {
  return Boolean(USERNAME && TOKEN);
}

function authHeader(): string {
  const encoded = Buffer.from(`${USERNAME}:${TOKEN}`).toString("base64");
  return `Basic ${encoded}`;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (!isNameComConfigured()) {
    throw new NameComError(
      "name.com API credentials are not configured. Set NAMECOM_USERNAME and NAMECOM_TOKEN.",
      500,
    );
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    // Domain availability changes constantly; never cache.
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message || data.details)) ||
      `name.com request failed (${res.status})`;
    throw new NameComError(message, res.status, data);
  }

  return data as T;
}

// --- Types (subset of the name.com v4 schema we use) ---

export interface DomainSearchResult {
  domainName: string;
  sld?: string;
  tld?: string;
  purchasable?: boolean;
  premium?: boolean;
  purchasePrice?: number;
  purchaseType?: string;
  renewalPrice?: number;
}

export interface DomainRecord {
  id: number;
  domainName: string;
  host: string;
  fqdn: string;
  type: string;
  answer: string;
  ttl: number;
  priority?: number;
}

export interface Domain {
  domainName: string;
  nameservers?: string[];
  expireDate?: string;
  createDate?: string;
  autorenewEnabled?: boolean;
  locked?: boolean;
  renewalPrice?: number;
}

// --- Endpoints ---

/** Check whether specific domain names are available (max 50). */
export async function checkAvailability(
  domainNames: string[],
): Promise<DomainSearchResult[]> {
  const data = await request<{ results?: DomainSearchResult[] }>(
    "/v4/domains:checkAvailability",
    { method: "POST", body: { domainNames } },
  );
  return data.results ?? [];
}

/** Suggest available domains for a keyword (creative TLD/SLD alternatives). */
export async function searchDomains(
  keyword: string,
  tldFilter?: string[],
): Promise<DomainSearchResult[]> {
  const data = await request<{ results?: DomainSearchResult[] }>(
    "/v4/domains:search",
    { method: "POST", body: { keyword, tldFilter } },
  );
  return data.results ?? [];
}

/** List domains registered under the reseller account. */
export async function listDomains(): Promise<Domain[]> {
  const data = await request<{ domains?: Domain[] }>("/v4/domains");
  return data.domains ?? [];
}

export async function getDomain(domainName: string): Promise<Domain> {
  return request<Domain>(`/v4/domains/${encodeURIComponent(domainName)}`);
}

// --- DNS records ---

export async function listRecords(domainName: string): Promise<DomainRecord[]> {
  const data = await request<{ records?: DomainRecord[] }>(
    `/v4/domains/${encodeURIComponent(domainName)}/records`,
  );
  return data.records ?? [];
}

export interface RecordInput {
  host?: string;
  type: string;
  answer: string;
  ttl?: number;
  priority?: number;
}

export async function createRecord(
  domainName: string,
  record: RecordInput,
): Promise<DomainRecord> {
  return request<DomainRecord>(
    `/v4/domains/${encodeURIComponent(domainName)}/records`,
    { method: "POST", body: record },
  );
}

export async function updateRecord(
  domainName: string,
  id: number,
  record: RecordInput,
): Promise<DomainRecord> {
  return request<DomainRecord>(
    `/v4/domains/${encodeURIComponent(domainName)}/records/${id}`,
    { method: "PUT", body: record },
  );
}

export async function deleteRecord(
  domainName: string,
  id: number,
): Promise<void> {
  await request<unknown>(
    `/v4/domains/${encodeURIComponent(domainName)}/records/${id}`,
    { method: "DELETE" },
  );
}
