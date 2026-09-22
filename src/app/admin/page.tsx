import { requireAdmin } from "@/lib/auth";
import { getDepartmentsWithRanges } from "@/lib/departments";
import AdminDashboard from "./AdminDashboard";
import DashboardHeader from "@/components/DashboardHeader";
import SupportLink from "@/components/SupportLink";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();

  const departmentsWithRanges = await getDepartmentsWithRanges();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <DashboardHeader
        title="Admin Dashboard"
        user={user}
        links={[{ href: "/dev", label: "Dev dashboard" }]}
      />

      <AdminDashboard departments={departmentsWithRanges} />

      <SupportLink />
    </main>
  );
}
