import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { csvUploads, manualCalculations, departments } from "@/db/schema";
import type { Qualification } from "@/lib/salary";

export interface CsvUploadSummary {
  id: string;
  filename: string;
  rowCount: number;
  createdAt: Date;
}

export async function listCsvUploads(): Promise<CsvUploadSummary[]> {
  return db
    .select({
      id: csvUploads.id,
      filename: csvUploads.filename,
      rowCount: csvUploads.rowCount,
      createdAt: csvUploads.createdAt,
    })
    .from(csvUploads)
    .orderBy(desc(csvUploads.createdAt));
}

export async function getCsvUpload(id: string) {
  const [row] = await db
    .select()
    .from(csvUploads)
    .where(eq(csvUploads.id, id));
  return row;
}

export interface ManualCalculationRow {
  id: number;
  name: string;
  email: string;
  departmentName: string;
  qualification: Qualification;
  experienceYears: number;
  experienceMonths: number;
  salary: number;
  createdAt: Date;
}

export async function listManualCalculations(): Promise<
  ManualCalculationRow[]
> {
  return db
    .select({
      id: manualCalculations.id,
      name: manualCalculations.name,
      email: manualCalculations.email,
      departmentName: departments.name,
      qualification: manualCalculations.qualification,
      experienceYears: manualCalculations.experienceYears,
      experienceMonths: manualCalculations.experienceMonths,
      salary: manualCalculations.salary,
      createdAt: manualCalculations.createdAt,
    })
    .from(manualCalculations)
    .innerJoin(
      departments,
      eq(manualCalculations.departmentId, departments.id),
    )
    .orderBy(desc(manualCalculations.createdAt));
}
