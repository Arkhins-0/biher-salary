"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type {
  CsvUploadSummary,
  ManualCalculationRow,
} from "@/lib/devQueries";
import { formatDateTime } from "@/lib/format";
import { pdfDownloadFilename } from "@/lib/pdfFilename";
import { useToast } from "@/components/notifications/NotificationsProvider";

type Mode = "csv" | "manual";
type SortDirection = "asc" | "desc";

interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

export default function DevDashboard({
  csvUploads,
  manualCalculations,
}: {
  csvUploads: CsvUploadSummary[];
  manualCalculations: ManualCalculationRow[];
}) {
  const [mode, setMode] = useState<Mode>("csv");

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit rounded-lg border border-black/10 p-1 dark:border-white/10">
        <TabButton active={mode === "csv"} onClick={() => setMode("csv")}>
          CSV uploads
        </TabButton>
        <TabButton
          active={mode === "manual"}
          onClick={() => setMode("manual")}
        >
          Manual entries
        </TabButton>
      </div>

      {mode === "csv" ? (
        <CsvUploadsTable uploads={csvUploads} />
      ) : (
        <ManualCalculationsTable rows={manualCalculations} />
      )}
    </div>
  );
}

type CsvSortKey = "filename" | "id" | "rowCount" | "createdAt";

function compareCsv(
  a: CsvUploadSummary,
  b: CsvUploadSummary,
  key: CsvSortKey,
): number {
  switch (key) {
    case "filename":
      return a.filename.localeCompare(b.filename);
    case "id":
      return a.id.localeCompare(b.id);
    case "rowCount":
      return a.rowCount - b.rowCount;
    case "createdAt":
      return a.createdAt.getTime() - b.createdAt.getTime();
  }
}

function CsvUploadsTable({ uploads }: { uploads: CsvUploadSummary[] }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState<CsvSortKey>>({
    key: "createdAt",
    direction: "desc",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? uploads.filter(
          (u) =>
            u.filename.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q),
        )
      : uploads;
    return [...matched].sort((a, b) => {
      const result = compareCsv(a, b, sort.key);
      return sort.direction === "asc" ? result : -result;
    });
  }, [uploads, query, sort]);

  function toggleSort(key: CsvSortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  if (uploads.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No CSV uploads yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by filename or upload ID…"
        className="h-10 w-full max-w-sm rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          No uploads match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="overflow-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <SortableHeader<CsvSortKey>
                  label="Filename"
                  sortKey="filename"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader<CsvSortKey>
                  label="Upload ID"
                  sortKey="id"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader<CsvSortKey>
                  label="Rows"
                  sortKey="rowCount"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader<CsvSortKey>
                  label="Created"
                  sortKey="createdAt"
                  sort={sort}
                  onSort={toggleSort}
                />
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((upload) => (
                <tr
                  key={upload.id}
                  className="border-t border-black/5 dark:border-white/10"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/dev/csv/${upload.id}`}
                      className="font-medium hover:underline"
                    >
                      {upload.filename}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-black/60 dark:text-white/60">
                    {upload.id}
                  </td>
                  <td className="px-3 py-2">{upload.rowCount}</td>
                  <td className="px-3 py-2 text-black/60 dark:text-white/60">
                    {formatDateTime(upload.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <a
                      href={`/api/csv-uploads/${upload.id}/pdf`}
                      download={pdfDownloadFilename(
                        upload.filename,
                        upload.id,
                      )}
                      onClick={() =>
                        toast.success(
                          "Download started",
                          `${upload.filename} PDF is downloading.`,
                        )
                      }
                      className="rounded-md border border-black/15 px-3 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                    >
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type ManualSortKey =
  | "name"
  | "email"
  | "departmentName"
  | "qualification"
  | "experience"
  | "salary"
  | "createdAt";

function compareManual(
  a: ManualCalculationRow,
  b: ManualCalculationRow,
  key: ManualSortKey,
): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "email":
      return a.email.localeCompare(b.email);
    case "departmentName":
      return a.departmentName.localeCompare(b.departmentName);
    case "qualification":
      return a.qualification.localeCompare(b.qualification);
    case "experience":
      return (
        a.experienceYears * 12 +
        a.experienceMonths -
        (b.experienceYears * 12 + b.experienceMonths)
      );
    case "salary":
      return a.salary - b.salary;
    case "createdAt":
      return a.createdAt.getTime() - b.createdAt.getTime();
  }
}

function ManualCalculationsTable({ rows }: { rows: ManualCalculationRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState<ManualSortKey>>({
    key: "createdAt",
    direction: "desc",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.departmentName.toLowerCase().includes(q) ||
            r.qualification.toLowerCase().includes(q),
        )
      : rows;
    return [...matched].sort((a, b) => {
      const result = compareManual(a, b, sort.key);
      return sort.direction === "asc" ? result : -result;
    });
  }, [rows, query, sort]);

  function toggleSort(key: ManualSortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No manual calculations yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email, department, or qualification…"
        className="h-10 w-full max-w-sm rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          No entries match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="overflow-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <SortableHeader<ManualSortKey>
                  label="Name"
                  sortKey="name"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader<ManualSortKey>
                  label="Email"
                  sortKey="email"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader<ManualSortKey>
                  label="Department"
                  sortKey="departmentName"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader<ManualSortKey>
                  label="Qual."
                  sortKey="qualification"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader<ManualSortKey>
                  label="Experience"
                  sortKey="experience"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader<ManualSortKey>
                  label="Salary"
                  sortKey="salary"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader<ManualSortKey>
                  label="Created"
                  sortKey="createdAt"
                  sort={sort}
                  onSort={toggleSort}
                />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-black/5 dark:border-white/10"
                >
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">{row.departmentName}</td>
                  <td className="px-3 py-2">{row.qualification}</td>
                  <td className="px-3 py-2">
                    {row.experienceYears}y {row.experienceMonths}m
                  </td>
                  <td className="px-3 py-2">
                    ₹{row.salary.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2 text-black/60 dark:text-white/60">
                    {formatDateTime(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortableHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <th className="px-3 py-2">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 font-semibold hover:text-black dark:hover:text-white"
      >
        {label}
        <span className="text-[10px] text-black/40 dark:text-white/40">
          {active ? (sort.direction === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </button>
    </th>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
