import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accountTokens, admins } from "@/db/schema";
import { getBaseUrl } from "./baseUrl";
import { inviteEmail, resetPasswordEmail, sendEmail } from "./email";

export type TokenPurpose = "setup" | "reset";

export const SETUP_TOKEN_TTL_DAYS = 7;
export const RESET_TOKEN_TTL_MINUTES = 60;

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Invalidates any outstanding tokens for the account and issues a fresh one.
 * Returns the raw token to embed in the emailed link.
 */
export async function issueToken(
  adminId: number,
  purpose: TokenPurpose,
): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const ttlMs =
    purpose === "setup"
      ? SETUP_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
      : RESET_TOKEN_TTL_MINUTES * 60 * 1000;

  await db
    .update(accountTokens)
    .set({ usedAt: new Date() })
    .where(
      and(eq(accountTokens.adminId, adminId), isNull(accountTokens.usedAt)),
    );

  await db.insert(accountTokens).values({
    adminId,
    purpose,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  });

  return raw;
}

export interface ValidToken {
  tokenId: number;
  purpose: TokenPurpose;
  account: {
    id: number;
    email: string | null;
    username: string | null;
    name: string | null;
    designation: string | null;
    role: "admin" | "dev";
    hasPassword: boolean;
  };
}

/** Looks up an unused, unexpired token belonging to a non-disabled account. */
export async function findValidToken(raw: string): Promise<ValidToken | null> {
  if (!raw || raw.length !== 64) return null;

  const [row] = await db
    .select({
      tokenId: accountTokens.id,
      purpose: accountTokens.purpose,
      id: admins.id,
      email: admins.email,
      username: admins.username,
      name: admins.name,
      designation: admins.designation,
      role: admins.role,
      passwordHash: admins.passwordHash,
      disabled: admins.disabled,
    })
    .from(accountTokens)
    .innerJoin(admins, eq(admins.id, accountTokens.adminId))
    .where(
      and(
        eq(accountTokens.tokenHash, hashToken(raw)),
        isNull(accountTokens.usedAt),
        gt(accountTokens.expiresAt, new Date()),
      ),
    );

  if (!row || row.disabled) return null;

  return {
    tokenId: row.tokenId,
    purpose: row.purpose,
    account: {
      id: row.id,
      email: row.email,
      username: row.username,
      name: row.name,
      designation: row.designation,
      role: row.role,
      hasPassword: Boolean(row.passwordHash),
    },
  };
}

export async function markTokenUsed(tokenId: number) {
  await db
    .update(accountTokens)
    .set({ usedAt: new Date() })
    .where(eq(accountTokens.id, tokenId));
}

/** Emails a first-time setup link to a new (or still pending) account. */
export async function sendSetupLink(account: {
  id: number;
  email: string;
  role: "admin" | "dev";
}) {
  const raw = await issueToken(account.id, "setup");
  const base = await getBaseUrl();
  await sendEmail(
    inviteEmail({
      to: account.email,
      role: account.role,
      setupUrl: `${base}/admin/set-password?token=${raw}`,
      expiresInDays: SETUP_TOKEN_TTL_DAYS,
    }),
  );
}

/** Emails a password reset link. */
export async function sendResetLink(account: { id: number; email: string }) {
  const raw = await issueToken(account.id, "reset");
  const base = await getBaseUrl();
  await sendEmail(
    resetPasswordEmail({
      to: account.email,
      resetUrl: `${base}/admin/set-password?token=${raw}`,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    }),
  );
}
