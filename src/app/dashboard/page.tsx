import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/dashboard");

  const domains = await prisma.domain.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your domains</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as {session.name || session.email}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
        >
          + Find a domain
        </Link>
      </div>

      {domains.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted">You don&apos;t have any domains yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Search for your first domain
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {domains.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <span className="font-mono">{d.domainName}</span>
                <span className="ml-3 rounded bg-green-500/15 px-1.5 py-0.5 text-xs capitalize text-green-500">
                  {d.status}
                </span>
              </div>
              <Link
                href={`/dashboard/domains/${d.domainName}`}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-background"
              >
                Manage DNS
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
