import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  jsonb,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import type { CsvUploadResultRow } from "@/lib/csv";

export const qualificationEnum = pgEnum("qualification", ["ME", "PhD"]);
export const roleEnum = pgEnum("role", ["admin", "dev"]);
export const tokenPurposeEnum = pgEnum("token_purpose", ["setup", "reset"]);

// Staff accounts (both "admin" and "dev" roles). Accounts created from the
// dev "Accounts" page start with only an email and no password; the invite
// email carries a setup link where the person picks a name, designation and
// password. `username` is kept for legacy seeded accounts and is optional.
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  email: text("email").unique(),
  name: text("name"),
  designation: text("designation"),
  passwordHash: text("password_hash"),
  role: roleEnum("role").notNull().default("admin"),
  disabled: boolean("disabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Single-use links for first-time account setup and password resets. Only a
// SHA-256 hash of the token is stored; the raw token lives in the email link.
export const accountTokens = pgTable("account_tokens", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  purpose: tokenPurposeEnum("purpose").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One row per (department, qualification) pair. Both the salary range and
// the experience range it's stretched over are set independently per row,
// so e.g. CSE-ME and CSE-PhD can use different experience caps.
export const salaryRanges = pgTable(
  "salary_ranges",
  {
    id: serial("id").primaryKey(),
    departmentId: integer("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    qualification: qualificationEnum("qualification").notNull(),
    minSalary: integer("min_salary").notNull(),
    maxSalary: integer("max_salary").notNull(),
    minExperienceYears: integer("min_experience_years").notNull().default(0),
    maxExperienceYears: integer("max_experience_years").notNull().default(20),
  },
  (table) => [
    uniqueIndex("uniq_dept_qualification").on(
      table.departmentId,
      table.qualification,
    ),
  ],
);

// One row per CSV upload. The full parsed sheet (including each row's
// calculated salary, or its validation error) is stored as JSON so the
// upload can be audited or re-downloaded later.
export const csvUploads = pgTable("csv_uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  data: jsonb("data").$type<CsvUploadResultRow[]>().notNull(),
  rowCount: integer("row_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One row per manual (single-entry) salary calculation.
export const manualCalculations = pgTable("manual_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  departmentId: integer("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  qualification: qualificationEnum("qualification").notNull(),
  experienceYears: integer("experience_years").notNull(),
  experienceMonths: integer("experience_months").notNull(),
  salary: integer("salary").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
