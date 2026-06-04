"use client";

import { useCallback, useEffect, useState } from "react";

interface Record {
  id: number;
  host: string;
  fqdn: string;
  type: string;
  answer: string;
  ttl: number;
  priority?: number;
}

const TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "ANAME"];

export function DnsManager({ domain }: { domain: string }) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // add-record form state
  const [host, setHost] = useState("");
  const [type, setType] = useState("A");
  const [answer, setAnswer] = useState("");
  const [ttl, setTtl] = useState(300);
  const [priority, setPriority] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/domains/${domain}/records`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records ?? []);
        setError(null);
      } else {
        setError(data.error ?? "Could not load records.");
      }
    } catch {
      setError("Could not load records.");
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/domains/${domain}/records`);
        const data = await res.json();
        if (!active) return;
        if (res.ok) {
          setRecords(data.records ?? []);
          setError(null);
        } else {
          setError(data.error ?? "Could not load records.");
        }
      } catch {
        if (active) setError("Could not load records.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [domain]);

  async function addRecord(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: RecordInput = {
        host,
        type,
        answer,
        ttl,
        ...(type === "MX" || type === "SRV" ? { priority } : {}),
      };
      const res = await fetch(`/api/domains/${domain}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setHost("");
        setAnswer("");
        await load();
      } else {
        setError(data.error ?? "Could not add record.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteRecord(id: number) {
    setError(null);
    const res = await fetch(`/api/domains/${domain}/records/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRecords((rs) => rs.filter((r) => r.id !== id));
    } else {
      const data = await res.json();
      setError(data.error ?? "Could not delete record.");
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Add record */}
      <form
        onSubmit={addRecord}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h2 className="mb-3 text-sm font-semibold">Add a record</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="host (e.g. www, @ for root)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-3"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="answer (e.g. 76.76.21.21)"
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-4"
          />
          {(type === "MX" || type === "SRV") && (
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              placeholder="priority"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-1"
            />
          )}
          <input
            type="number"
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
            placeholder="ttl"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-1"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 sm:col-span-1"
          >
            Add
          </button>
        </div>
      </form>

      {/* Records list */}
      {loading ? (
        <p className="text-sm text-muted">Loading records…</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-muted">No DNS records yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Host</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Answer</th>
                <th className="px-4 py-2 font-medium">TTL</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-mono">{r.host || "@"}</td>
                  <td className="px-4 py-2">{r.type}</td>
                  <td className="max-w-xs truncate px-4 py-2 font-mono">
                    {r.answer}
                  </td>
                  <td className="px-4 py-2">{r.ttl}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => deleteRecord(r.id)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface RecordInput {
  host: string;
  type: string;
  answer: string;
  ttl: number;
  priority?: number;
}
