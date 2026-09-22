import { db } from "@/db";
import { departments, salaryRanges } from "@/db/schema";

export interface DepartmentWithRanges {
  id: number;
  name: string;
  meMin: number;
  meMax: number;
  meMinExp: number;
  meMaxExp: number;
  phdMin: number;
  phdMax: number;
  phdMinExp: number;
  phdMaxExp: number;
}

export async function getDepartmentsWithRanges(): Promise<
  DepartmentWithRanges[]
> {
  const [deptRows, rangeRows] = await Promise.all([
    db.select().from(departments).orderBy(departments.name),
    db.select().from(salaryRanges),
  ]);

  return deptRows.map((dept) => {
    const me = rangeRows.find(
      (r) => r.departmentId === dept.id && r.qualification === "ME",
    );
    const phd = rangeRows.find(
      (r) => r.departmentId === dept.id && r.qualification === "PhD",
    );
    return {
      id: dept.id,
      name: dept.name,
      meMin: me?.minSalary ?? 0,
      meMax: me?.maxSalary ?? 0,
      meMinExp: me?.minExperienceYears ?? 0,
      meMaxExp: me?.maxExperienceYears ?? 20,
      phdMin: phd?.minSalary ?? 0,
      phdMax: phd?.maxSalary ?? 0,
      phdMinExp: phd?.minExperienceYears ?? 0,
      phdMaxExp: phd?.maxExperienceYears ?? 20,
    };
  });
}
