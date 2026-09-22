import type { DepartmentWithRanges } from "@/lib/departments";
import { PHD_EXPERIENCE_NOTICE } from "@/lib/salary";

export default function DepartmentPanel({
  departments,
}: {
  departments: DepartmentWithRanges[];
}) {
  if (departments.length === 0) {
    return null;
  }

  return (
    <aside className="w-full shrink-0 md:w-72">
      <div className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <p>{PHD_EXPERIENCE_NOTICE}</p>
      </div>

      <h2 className="mb-3 text-sm font-semibold tracking-wide text-black/50 uppercase dark:text-white/50">
        Department ranges
      </h2>
      <div className="flex flex-col gap-3">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="rounded-lg border border-black/10 p-3 text-xs dark:border-white/10"
          >
            <p className="mb-1.5 font-medium">{dept.name}</p>
            <p className="text-black/60 dark:text-white/60">
              ME: ₹{dept.meMin.toLocaleString("en-IN")}&ndash;₹
              {dept.meMax.toLocaleString("en-IN")} &middot; {dept.meMinExp}
              &ndash;
              {dept.meMaxExp} yrs
            </p>
            <p className="text-black/60 dark:text-white/60">
              PhD: ₹{dept.phdMin.toLocaleString("en-IN")}&ndash;₹
              {dept.phdMax.toLocaleString("en-IN")} &middot; {dept.phdMinExp}
              &ndash;
              {dept.phdMaxExp} yrs
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
