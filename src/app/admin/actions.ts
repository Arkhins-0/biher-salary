"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { departments, salaryRanges } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

function parsePositiveInt(value: FormDataEntryValue | null, label: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error(`${label} must be a whole, non-negative number.`);
  }
  return n;
}

interface QualificationInput {
  qualification: "ME" | "PhD";
  minSalary: number;
  maxSalary: number;
  minExperienceYears: number;
  maxExperienceYears: number;
}

function parseQualificationInput(
  formData: FormData,
  qualification: "ME" | "PhD",
  prefix: "me" | "phd",
  label: string,
): QualificationInput | { error: string } {
  const minSalary = parsePositiveInt(
    formData.get(`${prefix}Min`),
    `${label} min salary`,
  );
  const maxSalary = parsePositiveInt(
    formData.get(`${prefix}Max`),
    `${label} max salary`,
  );
  const minExperienceYears = parsePositiveInt(
    formData.get(`${prefix}MinExp`),
    `${label} min experience`,
  );
  const maxExperienceYears = parsePositiveInt(
    formData.get(`${prefix}MaxExp`),
    `${label} max experience`,
  );

  if (maxSalary < minSalary) {
    return { error: `${label} max salary must be greater than or equal to min.` };
  }
  if (maxExperienceYears <= minExperienceYears) {
    return {
      error: `${label} max experience must be greater than min experience.`,
    };
  }

  return {
    qualification,
    minSalary,
    maxSalary,
    minExperienceYears,
    maxExperienceYears,
  };
}

function isError(x: QualificationInput | { error: string }): x is { error: string } {
  return "error" in x;
}

export async function addDepartmentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Department name is required." };
  }

  try {
    const me = parseQualificationInput(formData, "ME", "me", "ME");
    if (isError(me)) return me;
    const phd = parseQualificationInput(formData, "PhD", "phd", "PhD");
    if (isError(phd)) return phd;

    const [dept] = await db.insert(departments).values({ name }).returning();

    await db.insert(salaryRanges).values([
      { departmentId: dept.id, ...me },
      { departmentId: dept.id, ...phd },
    ]);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("uniq") // unique constraint violation on name
    ) {
      return { error: "A department with that name already exists." };
    }
    return {
      error: err instanceof Error ? err.message : "Failed to add department.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function updateDepartmentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const departmentId = Number(formData.get("departmentId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!departmentId || !name) {
    return { error: "Missing department." };
  }

  try {
    const me = parseQualificationInput(formData, "ME", "me", "ME");
    if (isError(me)) return me;
    const phd = parseQualificationInput(formData, "PhD", "phd", "PhD");
    if (isError(phd)) return phd;

    await db
      .update(departments)
      .set({ name })
      .where(eq(departments.id, departmentId));

    for (const range of [me, phd]) {
      const existing = await db
        .select()
        .from(salaryRanges)
        .where(
          and(
            eq(salaryRanges.departmentId, departmentId),
            eq(salaryRanges.qualification, range.qualification),
          ),
        );

      if (existing.length > 0) {
        await db
          .update(salaryRanges)
          .set({
            minSalary: range.minSalary,
            maxSalary: range.maxSalary,
            minExperienceYears: range.minExperienceYears,
            maxExperienceYears: range.maxExperienceYears,
          })
          .where(eq(salaryRanges.id, existing[0].id));
      } else {
        await db.insert(salaryRanges).values({ departmentId, ...range });
      }
    }
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to update department.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function deleteDepartmentAction(formData: FormData) {
  await requireAdmin();
  const departmentId = Number(formData.get("departmentId"));
  if (!departmentId) return;

  await db.delete(departments).where(eq(departments.id, departmentId));

  revalidatePath("/admin");
  revalidatePath("/");
}
