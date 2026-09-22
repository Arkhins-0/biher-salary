import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accountTokens, admins } from "@/db/schema";
import { getBaseUrl } from "./baseUrl";
import {
  inviteEmail,
  resetPasswordEmail,
  sendEmail,
  verifyEmailChangeEmail,
} from "./email";

export type TokenPurpose = "setup" | "reset" | "email_change";

export const SETUP_TOKEN_TTL_DAYS = 7;
export const RESET_TOKEN_TTL_MINUTES = 60;
export const EMAIL_CHANGE_TTL_MINUTES = 60;

const TTL_MS: Record<TokenPurpose, number> = {
  setup: SETUP_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  reset: RESET_TOKEN_TTL_MINUTES * 60 * 1000,
  email_change: EMAIL_CHANGE_TTL_MINUTES * 60 * 1000,
};

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Invalidates any outstanding tokens of the same purpose for the account and
 * issues a fresh one. Returns the raw token to embed in the emailed link.
 */
export async function issueToken(
  adminId: number,
  purpose: TokenPurpose,
  extra: { newEmail?: string } = {},
): Promise<string> {
  const raw = randomBytes(32).toString("hex");

  await db
    .update(accountTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(accountTokens.adminId, adminId),
        eq(accountTokens.purpose, purpose),
        isNull(accountTokens.usedAt),
      ),
    );

  await db.insert(accountTokens).values({
    adminId,
    purpose,
    newEmail: extra.newEmail ?? null,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + TTL_MS[purpose]),
  });

  return raw;
}

export interface ValidToken {
  tokenId: number;
  purpose: TokenPurpose;
  newEmail: string | null;
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
export async function findValidToken(
  raw: string,
  purposes?: TokenPurpose[],
): Promise<ValidToken | null> {
  if (!raw || raw.length !== 64) return null;

  const [row] = await db
    .select({
      tokenId: accountTokens.id,
      purpose: accountTokens.purpose,
      newEmail: accountTokens.newEmail,
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
  if (purposes && !purposes.includes(row.purpose)) return null;

  return {
    tokenId: row.tokenId,
    purpose: row.purpose,
    newEmail: row.newEmail,
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

/** The email address awaiting verification for an account, if any. */
export async function getPendingEmailChange(
  adminId: number,
): Promise<string | null> {
  const [row] = await db
    .select({ newEmail: accountTokens.newEmail })
    .from(accountTokens)
    .where(
      and(
        eq(accountTokens.adminId, adminId),
        eq(accountTokens.purpose, "email_change"),
        isNull(accountTokens.usedAt),
        gt(accountTokens.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(accountTokens.createdAt))
    .limit(1);
  return row?.newEmail ?? null;
}

/** Emails a first-time setup link to a new (or still pending) account. */
export async function sendSetupLink(account: {
  id: number;
  email: string;
  role: "admin" | "dev";
}) {
  const raw = await issueToken(account.id, "setup");
  const baseUrl = await getBaseUrl();
  await sendEmail(
    inviteEmail(
      { baseUrl },
      {
        to: account.email,
        role: account.role,
        setupUrl: `${baseUrl}/admin/set-password?token=${raw}`,
        expiresInDays: SETUP_TOKEN_TTL_DAYS,
      },
    ),
  );
}

/** Emails a password reset link. */
export async function sendResetLink(account: { id: number; email: string }) {
  const raw = await issueToken(account.id, "reset");
  const baseUrl = await getBaseUrl();
  await sendEmail(
    resetPasswordEmail(
      { baseUrl },
      {
        to: account.email,
        resetUrl: `${baseUrl}/admin/set-password?token=${raw}`,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      },
    ),
  );
}

/** Emails a verification link to the *new* address for an email change. */
export async function sendEmailChangeLink(account: {
  id: number;
  currentEmail: string | null;
  newEmail: string;
}) {
  const raw = await issueToken(account.id, "email_change", {
    newEmail: account.newEmail,
  });
  const baseUrl = await getBaseUrl();
  await sendEmail(
    verifyEmailChangeEmail(
      { baseUrl },
      {
        to: account.newEmail,
        currentEmail: account.currentEmail,
        verifyUrl: `${baseUrl}/admin/verify-email?token=${raw}`,
        expiresInMinutes: EMAIL_CHANGE_TTL_MINUTES,
      },
    ),
  );
}
