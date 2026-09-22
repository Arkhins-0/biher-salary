"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { findValidToken, markTokenUsed } from "@/lib/accountTokens";
import { dashboardPathFor } from "@/lib/auth";
import { getSession } from "@/lib/session";

export type SetPasswordState = { error?: string };

const MIN_PASSWORD_LENGTH = 8;

export async function setPasswordAction(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const valid = await findValidToken(token);
  if (!valid) {
    return {
      error:
        "This link is invalid or has expired. Request a new one from the sign-in page.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  // First-time setup: the person must also give a name and designation.
  const isSetup = !valid.account.hasPassword;
  const name = String(formData.get("name") ?? "").trim();
  const designation = String(formData.get("designation") ?? "").trim();

  if (isSetup) {
    if (!name) return { error: "Name is required." };
    if (!designation) return { error: "Designation is required." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db
    .update(admins)
    .set({
      passwordHash,
      ...(isSetup ? { name, designation } : {}),
    })
    .where(eq(admins.id, valid.account.id));

  await markTokenUsed(valid.tokenId);

  if (isSetup) {
    // Their "first login": sign them straight in.
    const session = await getSession();
    session.isLoggedIn = true;
    session.userId = valid.account.id;
    session.role = valid.account.role;
    await session.save();
    redirect(dashboardPathFor(valid.account.role));
  }

  // Password reset: clear any existing session and ask them to sign in.
  const session = await getSession();
  session.destroy();
  redirect("/admin/login?notice=reset");
}
