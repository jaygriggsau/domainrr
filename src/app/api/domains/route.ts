import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizeQuery } from "@/lib/domains";

const FQDN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** List the domains owned by the signed-in user. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const domains = await prisma.domain.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ domains });
}

const schema = z.object({
  domainName: z.string().trim().min(3).max(253),
});

/**
 * Claim a domain for the signed-in user's account.
 *
 * NOTE: This records ownership in our database. Wiring a real purchase means
 * calling name.com's `POST /v4/domains` with registrant contacts + purchase
 * price; that requires a billing/contact flow which lives outside this MVP.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid domain name." }, { status: 400 });
  }

  const domainName = normalizeQuery(parsed.data.domainName);
  if (!FQDN_RE.test(domainName)) {
    return NextResponse.json({ error: "Invalid domain name." }, { status: 400 });
  }

  const existing = await prisma.domain.findUnique({ where: { domainName } });
  if (existing) {
    return NextResponse.json(
      { error: "That domain is already in an account." },
      { status: 409 },
    );
  }

  const domain = await prisma.domain.create({
    data: { domainName, userId: session.userId, status: "active" },
  });

  return NextResponse.json({ domain });
}
