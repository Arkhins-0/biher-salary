"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { sendResetLink, sendSetupLink } from "@/lib/accountTokens";

export type ForgotState = { error?: string; sent?: boolean };

export async function forgotPasswordAction(
  _prevState: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Enter the email address for your account." };
  }

  const [account] = await db
    .select({
      id: admins.id,
      email: admins.email,
      role: admins.role,
      disabled: admins.disabled,
      passwordHash: admins.passwordHash,
    })
    .from(admins)
    .where(eq(admins.email, email));

  // Always report success so the form can't be used to discover which
  // emails have accounts.
  if (account && account.email && !account.disabled) {
    try {
      if (account.passwordHash) {
        await sendResetLink({ id: account.id, email: account.email });
      } else {
        await sendSetupLink({
          id: account.id,
          email: account.email,
          role: account.role,
        });
      }
    } catch (err) {
      console.error("Failed to send password email", err);
      return {
        error:
          "We could not send the email right now. Please try again in a few minutes.",
      };
    }
  }

  return { sent: true };
}
