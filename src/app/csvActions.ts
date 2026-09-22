"use server";

import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { departments, salaryRanges, csvUploads } from "@/db/schema";
import { calculateSalary } from "@/lib/salary";
import {
  parseCsvUploadRows,
  type CsvUploadRowInput,
  type CsvUploadResultRow,
} from "@/lib/csv";

export type CsvPreviewRow = CsvUploadRowInput & { departmentId?: number };

export interface CsvPreviewResult {
  rows: CsvPreviewRow[];
  validCount: number;
  invalidCount: number;
  headerError?: string;
}

export async function previewCsvUploadAction(
  csvText: string,
): Promise<CsvPreviewResult> {
  const { rows, headerError } = parseCsvUploadRows(csvText);
  if (headerError) {
    return { rows: [], validCount: 0, invalidCount: 0, headerError };
  }
  if (rows.length === 0) {
    return {
      rows: [],
      validCount: 0,
      invalidCount: 0,
      headerError: "No data rows found in the CSV file.",
    };
  }

  const depts = await db.select().from(departments);
  const byName = new Map(depts.map((d) => [d.name.trim().toLowerCase(), d]));

  const enriched: CsvPreviewRow[] = rows.map((row) => {
    if (row.error) return row;
    const dept = byName.get(row.department.trim().toLowerCase());
    if (!dept) {
      return { ...row, error: `Unknown department: ${row.department}` };
    }
    return { ...row, departmentId: dept.id };
  });

  const validCount = enriched.filter((r) => !r.error).length;
  return {
    rows: enriched,
    validCount,
    invalidCount: enriched.length - validCount,
  };
}

export interface CsvCalculateResult {
  uploadId: string;
  calculatedCount: number;
  errorCount: number;
}

export async function calculateCsvUploadAction(
  rows: CsvPreviewRow[],
  filename: string,
): Promise<CsvCalculateResult> {
  const departmentIds = [
    ...new Set(
      rows
        .map((r) => r.departmentId)
        .filter((id): id is number => id !== undefined),
    ),
  ];

  const ranges = departmentIds.length
    ? await db
        .select()
        .from(salaryRanges)
        .where(inArray(salaryRanges.departmentId, departmentIds))
    : [];

  const results: CsvUploadResultRow[] = rows.map((row) => {
    if (row.error || row.departmentId === undefined) {
      return { ...row, salary: null };
    }
    const range = ranges.find(
      (r) =>
        r.departmentId === row.departmentId &&
        r.qualification === row.qualification,
    );
    if (!range) {
      return {
        ...row,
        salary: null,
        error: `No salary range configured for ${row.department} / ${row.qualification}`,
      };
    }
    const salary = calculateSalary({
      minSalary: range.minSalary,
      maxSalary: range.maxSalary,
      minExperienceYears: range.minExperienceYears,
      maxExperienceYears: range.maxExperienceYears,
      experienceYears: row.experienceYears!,
      experienceMonths: row.experienceMonths!,
    });
    return { ...row, salary };
  });

  const [saved] = await db
    .insert(csvUploads)
    .values({
      filename,
      data: results,
      rowCount: results.length,
    })
    .returning();

  return {
    uploadId: saved.id,
    calculatedCount: results.filter((r) => r.salary !== null).length,
    errorCount: results.filter((r) => r.salary === null).length,
  };
}
