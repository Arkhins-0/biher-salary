import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { getSession } from "./session";

export type Role = "admin" | "dev";

export interface CurrentUser {
  id: number;
  username: string | null;
  email: string | null;
  name: string | null;
  designation: string | null;
  role: Role;
}

export function displayName(user: {
  name: string | null;
  email: string | null;
  username: string | null;
}) {
  return user.name || user.email || user.username || "Account";
}

export function dashboardPathFor(role: Role) {
  return role === "dev" ? "/dev" : "/admin";
}

/**
 * Loads the signed-in account from the database. Returns null (and clears the
 * session) if there is no session, the account was removed, or it was
 * disabled after the session was created.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }

  const [user] = await db
    .select({
      id: admins.id,
      username: admins.username,
      email: admins.email,
      name: admins.name,
      designation: admins.designation,
      role: admins.role,
      disabled: admins.disabled,
      passwordHash: admins.passwordHash,
    })
    .from(admins)
    .where(eq(admins.id, session.userId));

  if (!user || user.disabled || !user.passwordHash) {
    session.destroy();
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    designation: user.designation,
    role: user.role,
  };
}

/** Any signed-in account (admin or dev). */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/dev");
  }
  return user;
}

/** /dev is readable by both roles. */
export async function requireDev(): Promise<CurrentUser> {
  return requireUser();
}

/** Strictly the "dev" role. Used for account management. */
export async function requireDevRole(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "dev") {
    redirect("/admin");
  }
  return user;
}
