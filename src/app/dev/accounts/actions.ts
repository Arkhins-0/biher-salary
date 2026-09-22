"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { requireDevRole } from "@/lib/auth";
import { sendSetupLink } from "@/lib/accountTokens";

export type AccountsActionState = {
  error?: string;
  success?: string;
};

function parseRole(value: FormDataEntryValue | null): "admin" | "dev" {
  return value === "dev" ? "dev" : "admin";
}

export async function createAccountAction(
  _prev: AccountsActionState,
  formData: FormData,
): Promise<AccountsActionState> {
  await requireDevRole();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = parseRole(formData.get("role"));

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const [existing] = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.email, email));
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const [created] = await db
    .insert(admins)
    .values({ email, role })
    .returning({ id: admins.id });

  try {
    await sendSetupLink({ id: created.id, email, role });
  } catch (err) {
    console.error("Failed to send setup email", err);
    revalidatePath("/dev/accounts");
    return {
      error:
        "The account was created but the invitation email could not be sent. Use “Resend invite” to try again.",
    };
  }

  revalidatePath("/dev/accounts");
  return { success: `Invitation sent to ${email}.` };
}

async function loadTarget(formData: FormData) {
  const me = await requireDevRole();
  const id = Number(formData.get("id"));
  if (!id) throw new Error("Missing account.");
  if (id === me.id) throw new Error("You cannot change your own account here.");

  const [target] = await db.select().from(admins).where(eq(admins.id, id));
  if (!target) throw new Error("Account not found.");
  return target;
}

export async function resendInviteAction(
  _prev: AccountsActionState,
  formData: FormData,
): Promise<AccountsActionState> {
  try {
    const target = await loadTarget(formData);
    if (!target.email) {
      return { error: "This account has no email address." };
    }
    if (target.passwordHash) {
      return { error: "This account is already set up." };
    }
    await sendSetupLink({
      id: target.id,
      email: target.email,
      role: target.role,
    });
    return { success: `Invitation re-sent to ${target.email}.` };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to resend invite.",
    };
  }
}

export async function setDisabledAction(
  _prev: AccountsActionState,
  formData: FormData,
): Promise<AccountsActionState> {
  try {
    const target = await loadTarget(formData);
    const disabled = formData.get("disabled") === "true";
    await db.update(admins).set({ disabled }).where(eq(admins.id, target.id));
    revalidatePath("/dev/accounts");
    return {
      success: `${target.email ?? target.username} ${disabled ? "disabled" : "enabled"}.`,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update account.",
    };
  }
}

export async function deleteAccountAction(
  _prev: AccountsActionState,
  formData: FormData,
): Promise<AccountsActionState> {
  try {
    const target = await loadTarget(formData);
    await db.delete(admins).where(eq(admins.id, target.id));
    revalidatePath("/dev/accounts");
    return { success: `${target.email ?? target.username} removed.` };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to remove account.",
    };
  }
}
