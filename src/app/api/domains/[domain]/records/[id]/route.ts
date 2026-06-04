import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDomainOwner } from "@/lib/ownership";
import { deleteRecord, updateRecord, NameComError } from "@/lib/namecom";

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "ANAME"] as const;

const recordSchema = z.object({
  host: z.string().trim().max(255).optional().default(""),
  type: z.enum(RECORD_TYPES),
  answer: z.string().trim().min(1).max(2048),
  ttl: z.number().int().min(300).max(604800).optional().default(300),
  priority: z.number().int().min(0).max(65535).optional(),
});

function handleError(err: unknown) {
  if (err instanceof NameComError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json(
    { error: "Something went wrong talking to the registrar." },
    { status: 500 },
  );
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ domain: string; id: string }> },
) {
  const { domain, id } = await params;
  const recordId = Number(id);
  if (!Number.isInteger(recordId)) {
    return NextResponse.json({ error: "Invalid record id." }, { status: 400 });
  }

  const guard = await requireDomainOwner(domain);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = recordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid DNS record." }, { status: 400 });
  }

  try {
    const record = await updateRecord(domain, recordId, parsed.data);
    return NextResponse.json({ record });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ domain: string; id: string }> },
) {
  const { domain, id } = await params;
  const recordId = Number(id);
  if (!Number.isInteger(recordId)) {
    return NextResponse.json({ error: "Invalid record id." }, { status: 400 });
  }

  const guard = await requireDomainOwner(domain);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    await deleteRecord(domain, recordId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
