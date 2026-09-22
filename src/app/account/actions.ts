"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { sendEmailChangeLink } from "@/lib/accountTokens";

export type AccountActionState = {
  error?: string;
  success?: boolean;
  /** Set when a verification email was sent for a new address. */
  pendingEmail?: string;
};

const MIN_PASSWORD_LENGTH = 8;

export async function updateProfileAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const designation = String(formData.get("designation") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!name) return { error: "Name is required." };
  if (!designation) return { error: "Designation is required." };
  if (!email || !email.includes("@")) {
    return { error: "A valid email address is required." };
  }

  const emailChanged = email !== (user.email ?? "").toLowerCase();

  if (emailChanged) {
    const [taken] = await db
      .select({ id: admins.id })
      .from(admins)
      .where(and(eq(admins.email, email), ne(admins.id, user.id)));
    if (taken) {
      return { error: "That email is already used by another account." };
    }
  }

  // Name and designation apply immediately. The email only changes once the
  // new address is verified from the link we send it.
  await db
    .update(admins)
    .set({ name, designation })
    .where(eq(admins.id, user.id));

  let pendingEmail: string | undefined;
  if (emailChanged) {
    try {
      await sendEmailChangeLink({
        id: user.id,
        currentEmail: user.email,
        newEmail: email,
      });
      pendingEmail = email;
    } catch (err) {
      console.error("Failed to send email verification", err);
      revalidatePath("/account");
      return {
        error:
          "Your name and designation were saved, but the verification email could not be sent. Try changing the email again in a few minutes.",
      };
    }
  }

  revalidatePath("/account");
  revalidatePath("/admin");
  revalidatePath("/dev");
  return { success: true, pendingEmail };
}

export async function changePasswordAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current) return { error: "Enter your current password." };
  if (next.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (next !== confirm) return { error: "New passwords do not match." };

  const [row] = await db
    .select({ passwordHash: admins.passwordHash })
    .from(admins)
    .where(eq(admins.id, user.id));

  if (!row?.passwordHash || !(await bcrypt.compare(current, row.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  await db
    .update(admins)
    .set({ passwordHash: await bcrypt.hash(next, 10) })
    .where(eq(admins.id, user.id));

  return { success: true };
}
