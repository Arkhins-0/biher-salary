import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { findValidToken, markTokenUsed } from "@/lib/accountTokens";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Landing route for the "Verify email address" link. Applies the pending
 * email change, signs the user out, and sends them to the login page with a
 * notice. Runs as a route handler because it needs to clear the session
 * cookie, which server components are not allowed to do.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const loginUrl = new URL("/admin/login", url.origin);

  const valid = await findValidToken(token, ["email_change"]);
  if (!valid || !valid.newEmail) {
    loginUrl.searchParams.set("notice", "email-invalid");
    return NextResponse.redirect(loginUrl);
  }

  // The address may have been claimed by another account since the link
  // was sent.
  const [taken] = await db
    .select({ id: admins.id })
    .from(admins)
    .where(and(eq(admins.email, valid.newEmail), ne(admins.id, valid.account.id)));
  if (taken) {
    await markTokenUsed(valid.tokenId);
    loginUrl.searchParams.set("notice", "email-taken");
    return NextResponse.redirect(loginUrl);
  }

  await db
    .update(admins)
    .set({ email: valid.newEmail })
    .where(eq(admins.id, valid.account.id));
  await markTokenUsed(valid.tokenId);

  const session = await getSession();
  session.destroy();

  loginUrl.searchParams.set("notice", "email-verified");
  return NextResponse.redirect(loginUrl);
}
