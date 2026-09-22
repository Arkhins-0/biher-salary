import { requireDev } from "@/lib/auth";
import { listCsvUploads, listManualCalculations } from "@/lib/devQueries";
import DashboardHeader from "@/components/DashboardHeader";
import SupportLink from "@/components/SupportLink";
import DevDashboard from "./DevDashboard";

export const dynamic = "force-dynamic";

export default async function DevPage() {
  const user = await requireDev();

  const [csvUploads, manualCalculations] = await Promise.all([
    listCsvUploads(),
    listManualCalculations(),
  ]);

  const links =
    user.role === "dev"
      ? [{ href: "/dev/accounts", label: "Manage accounts" }]
      : [{ href: "/admin", label: "Admin dashboard" }];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <DashboardHeader title="Dev Dashboard" user={user} links={links} />

      <DevDashboard
        csvUploads={csvUploads}
        manualCalculations={manualCalculations}
      />

      <SupportLink />
    </main>
  );
}
