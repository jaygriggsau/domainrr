import "server-only";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session";

export type OwnershipResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; status: 401 | 403 | 404; error: string };

/**
 * Ensure there is a signed-in user who owns `domainName`. Used to gate DNS
 * management so a user can only touch domains in their own account.
 */
export async function requireDomainOwner(
  domainName: string,
): Promise<OwnershipResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, status: 401, error: "Not authenticated." };
  }

  const domain = await prisma.domain.findUnique({
    where: { domainName },
    select: { userId: true },
  });

  if (!domain) {
    return { ok: false, status: 404, error: "Domain not found." };
  }
  if (domain.userId !== session.userId) {
    return { ok: false, status: 403, error: "You do not own this domain." };
  }

  return { ok: true, session };
}
