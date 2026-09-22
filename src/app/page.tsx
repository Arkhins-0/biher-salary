import Link from "next/link";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { getDepartmentsWithRanges } from "@/lib/departments";
import CalculatorTabs from "@/components/CalculatorTabs";
import DepartmentPanel from "@/components/DepartmentPanel";
import Logo from "@/components/Logo";
import SupportLink from "@/components/SupportLink";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [depts, deptsWithRanges] = await Promise.all([
    db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .orderBy(departments.name),
    getDepartmentsWithRanges(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-xl font-semibold">Staff Salary Calculator</h1>
        </div>
        <Link
          href="/admin"
          className="text-sm text-black/60 underline-offset-4 hover:underline dark:text-white/60"
        >
          Admin
        </Link>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="min-w-0 flex-1">
          {depts.length === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60">
              No departments have been configured yet. An admin needs to add
              departments and salary ranges first.
            </p>
          ) : (
            <CalculatorTabs departments={depts} />
          )}
        </div>
        <DepartmentPanel departments={deptsWithRanges} />
      </div>
      <SupportLink />
    </main>
  );
}
