"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { getSession } from "@/lib/session";
import { dashboardPathFor } from "@/lib/auth";

export type LoginState = { error?: string; needsSetup?: boolean };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Email and password are required." };
  }

  const [account] = await db
    .select()
    .from(admins)
    .where(
      or(
        eq(admins.email, identifier.toLowerCase()),
        eq(admins.username, identifier),
      ),
    );

  if (!account) {
    return { error: "Invalid email or password." };
  }

  if (account.disabled) {
    return { error: "This account has been disabled. Contact support." };
  }

  if (!account.passwordHash) {
    return {
      needsSetup: true,
      error:
        "This account has not been set up yet. Use the setup link from your invitation email, or request a new one.",
    };
  }

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = account.id;
  session.role = account.role;
  await session.save();

  redirect(dashboardPathFor(account.role));
}

export async function logoutAction() {
  "use server";
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}
