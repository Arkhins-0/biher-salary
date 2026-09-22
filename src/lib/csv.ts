export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += char;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

export function stringifyCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const s = String(value);
          return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
}

export const CSV_TEMPLATE_HEADERS = [
  "name",
  "email",
  "department",
  "qualification",
  "experience_years",
  "experience_months",
] as const;

export const CSV_TEMPLATE_EXAMPLE_ROW = [
  "Jane Doe",
  "jane.doe@example.com",
  "CSE",
  "ME",
  "3",
  "6",
];

export interface CsvUploadRowInput {
  rowNumber: number;
  name: string;
  email: string;
  department: string;
  qualification: string;
  experienceYears: number | null;
  experienceMonths: number | null;
  error?: string;
}

export interface CsvUploadResultRow extends CsvUploadRowInput {
  departmentId?: number;
  salary: number | null;
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name"],
  email: ["email"],
  department: ["department", "dept"],
  qualification: [
    "qualification",
    "qualification me or phd",
    "me or phd",
    "degree",
  ],
  experienceYears: [
    "experience_years",
    "experience years",
    "experience in years",
    "years",
  ],
  experienceMonths: [
    "experience_months",
    "experience months",
    "experience in months",
    "months",
  ],
};

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchHeader(normalized: string): keyof typeof HEADER_ALIASES | null {
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) {
      return key as keyof typeof HEADER_ALIASES;
    }
  }
  return null;
}

export function normalizeQualification(input: string): "ME" | "PhD" | null {
  const normalized = input.trim().toLowerCase().replace(/[.\s]/g, "");
  if (normalized === "me") return "ME";
  if (normalized === "phd") return "PhD";
  return null;
}

export interface ParseCsvUploadResult {
  rows: CsvUploadRowInput[];
  headerError?: string;
}

export function parseCsvUploadRows(text: string): ParseCsvUploadResult {
  const table = parseCsv(text);
  if (table.length === 0) {
    return { rows: [], headerError: "The CSV file is empty." };
  }

  const [headerRow, ...dataRows] = table;
  const columnIndex: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
  headerRow.forEach((header, idx) => {
    const key = matchHeader(normalizeHeader(header));
    if (key && columnIndex[key] === undefined) {
      columnIndex[key] = idx;
    }
  });

  const required: (keyof typeof HEADER_ALIASES)[] = [
    "name",
    "email",
    "department",
    "qualification",
    "experienceYears",
    "experienceMonths",
  ];
  const missing = required.filter((key) => columnIndex[key] === undefined);
  if (missing.length > 0) {
    return {
      rows: [],
      headerError: `Missing required column(s): ${missing.join(", ")}. Download the template for the expected format.`,
    };
  }

  const rows: CsvUploadRowInput[] = dataRows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells, idx) => {
      const get = (key: keyof typeof HEADER_ALIASES) =>
        (cells[columnIndex[key]!] ?? "").trim();

      const name = get("name");
      const email = get("email");
      const department = get("department");
      const rawQualification = get("qualification");
      const yearsRaw = get("experienceYears");
      const monthsRaw = get("experienceMonths");

      const experienceYears = yearsRaw === "" ? null : Number(yearsRaw);
      const experienceMonths = monthsRaw === "" ? null : Number(monthsRaw);
      const qualification = normalizeQualification(rawQualification);

      let error: string | undefined;
      if (!name) {
        error = "Missing name";
      } else if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        error = "Missing or invalid email";
      } else if (!department) {
        error = "Missing department";
      } else if (!qualification) {
        error = "Qualification must be ME or PhD";
      } else if (
        experienceYears === null ||
        !Number.isFinite(experienceYears) ||
        experienceYears < 0
      ) {
        error = "Invalid experience (years)";
      } else if (
        experienceMonths === null ||
        !Number.isFinite(experienceMonths) ||
        experienceMonths < 0 ||
        experienceMonths > 11
      ) {
        error = "Invalid experience (months, must be 0-11)";
      }

      return {
        rowNumber: idx + 1, // 1-indexed position among data rows
        name,
        email,
        department,
        qualification: qualification ?? rawQualification,
        experienceYears,
        experienceMonths,
        error,
      };
    });

  return { rows };
}
