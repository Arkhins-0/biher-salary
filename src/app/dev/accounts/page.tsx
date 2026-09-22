import { desc } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { requireDevRole } from "@/lib/auth";
import DashboardHeader from "@/components/DashboardHeader";
import SupportLink from "@/components/SupportLink";
import AccountsManager, { type AccountRow } from "./AccountsManager";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const user = await requireDevRole();

  const rows = await db
    .select({
      id: admins.id,
      username: admins.username,
      email: admins.email,
      name: admins.name,
      designation: admins.designation,
      role: admins.role,
      disabled: admins.disabled,
      passwordHash: admins.passwordHash,
      createdAt: admins.createdAt,
    })
    .from(admins)
    .orderBy(desc(admins.createdAt));

  const accounts: AccountRow[] = rows.map((r) => ({
    id: r.id,
    username: r.username,
    email: r.email,
    name: r.name,
    designation: r.designation,
    role: r.role,
    disabled: r.disabled,
    pending: !r.passwordHash,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <DashboardHeader
        title="Accounts"
        user={user}
        links={[{ href: "/dev", label: "Calculation history" }]}
      />

      <AccountsManager accounts={accounts} currentUserId={user.id} />

      <SupportLink />
    </main>
  );
}
