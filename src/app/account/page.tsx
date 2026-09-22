import Link from "next/link";
import { dashboardPathFor, requireUser } from "@/lib/auth";
import { getPendingEmailChange } from "@/lib/accountTokens";
import DashboardHeader from "@/components/DashboardHeader";
import SupportLink from "@/components/SupportLink";
import AccountSettings from "./AccountSettings";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const back = dashboardPathFor(user.role);
  const pendingEmail = await getPendingEmailChange(user.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <DashboardHeader
        title="Account settings"
        user={user}
        links={[{ href: back, label: "Back to dashboard" }]}
      />

      <AccountSettings user={user} pendingEmail={pendingEmail} />

      <p className="mt-8 text-sm">
        <Link
          href={back}
          className="text-black/60 underline underline-offset-4 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          &larr; Back to dashboard
        </Link>
      </p>

      <SupportLink />
    </main>
  );
}
