"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { departments, salaryRanges, manualCalculations } from "@/db/schema";
import { calculateSalary, type Qualification } from "@/lib/salary";

export type CalculateState = {
  error?: string;
  result?: {
    name: string;
    salary: number;
    departmentName: string;
    qualification: Qualification;
    cappedExperience: boolean;
  };
};

export async function calculateSalaryAction(
  _prevState: CalculateState,
  formData: FormData,
): Promise<CalculateState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const departmentId = Number(formData.get("departmentId"));
  const qualification = String(
    formData.get("qualification"),
  ) as Qualification;
  const years = Number(formData.get("years") ?? 0);
  const months = Number(formData.get("months") ?? 0);

  if (!name) {
    return { error: "Please enter your name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!departmentId || (qualification !== "ME" && qualification !== "PhD")) {
    return { error: "Please choose a department and qualification." };
  }
  if (
    !Number.isFinite(years) ||
    !Number.isFinite(months) ||
    years < 0 ||
    months < 0 ||
    months > 11
  ) {
    return { error: "Please enter a valid experience (years and months)." };
  }

  const [dept] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, departmentId));

  if (!dept) {
    return { error: "Selected department no longer exists." };
  }

  const [range] = await db
    .select()
    .from(salaryRanges)
    .where(
      and(
        eq(salaryRanges.departmentId, departmentId),
        eq(salaryRanges.qualification, qualification),
      ),
    );

  if (!range) {
    return {
      error: "No salary range configured for this department/qualification.",
    };
  }

  const salary = calculateSalary({
    minSalary: range.minSalary,
    maxSalary: range.maxSalary,
    minExperienceYears: range.minExperienceYears,
    maxExperienceYears: range.maxExperienceYears,
    experienceYears: years,
    experienceMonths: months,
  });

  await db.insert(manualCalculations).values({
    name,
    email,
    departmentId,
    qualification,
    experienceYears: years,
    experienceMonths: months,
    salary,
  });

  const totalExperience = years + months / 12;

  return {
    result: {
      name,
      salary,
      departmentName: dept.name,
      qualification,
      cappedExperience: totalExperience > range.maxExperienceYears,
    },
  };
}
