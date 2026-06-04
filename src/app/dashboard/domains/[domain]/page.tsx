import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DnsManager } from "@/components/DnsManager";

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?from=/dashboard/domains/${domain}`);

  const record = await prisma.domain.findUnique({
    where: { domainName: domain },
  });
  if (!record || record.userId !== session.userId) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
        ← Back to domains
      </Link>
      <h1 className="mt-3 font-mono text-2xl font-semibold tracking-tight">
        {record.domainName}
      </h1>
      <p className="mt-1 text-sm text-muted">DNS records</p>

      <div className="mt-8">
        <DnsManager domain={record.domainName} />
      </div>
    </div>
  );
}
