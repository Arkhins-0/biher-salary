"use client";

import { useRef, useState } from "react";
import {
  previewCsvUploadAction,
  calculateCsvUploadAction,
  type CsvPreviewRow,
} from "@/app/csvActions";
import { PHD_EXPERIENCE_NOTICE } from "@/lib/salary";
import { pdfDownloadFilename } from "@/lib/pdfFilename";
import {
  useConfirm,
  useToast,
} from "@/components/notifications/NotificationsProvider";

type Status = "idle" | "loading" | "previewed" | "calculating" | "done";

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function CsvUploadForm() {
  const confirm = useConfirm();
  const toast = useToast();
  const [status, setStatus] = useState<Status>("idle");
  const [rows, setRows] = useState<CsvPreviewRow[]>([]);
  const [headerError, setHeaderError] = useState<string | undefined>();
  const [filename, setFilename] = useState("");
  const [summary, setSummary] = useState<{
    calculatedCount: number;
    errorCount: number;
    uploadId: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleChooseFileClick() {
    const approved = await confirm({
      title: "PhD experience notice",
      description: PHD_EXPERIENCE_NOTICE,
      confirmLabel: "Choose file",
    });
    if (!approved) return;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setStatus("loading");
    setSummary(null);
    setHeaderError(undefined);
    setRows([]);

    const text = await file.text();
    const result = await previewCsvUploadAction(text);

    if (result.headerError) {
      setHeaderError(result.headerError);
      setStatus("idle");
      return;
    }

    setRows(result.rows);
    setStatus("previewed");
  }

  async function handleApprove() {
    const validCount = rows.filter((r) => !r.error).length;
    const invalidCount = rows.length - validCount;
    const approved = await confirm({
      title: "Calculate salaries?",
      description:
        `Calculate salary for ${validCount} valid row(s).` +
        (invalidCount > 0
          ? ` ${invalidCount} row(s) with errors will be skipped.`
          : ""),
      confirmLabel: "Approve & calculate",
    });
    if (!approved) return;

    setStatus("calculating");
    const result = await calculateCsvUploadAction(rows, filename);

    triggerDownload(
      `/api/csv-uploads/${result.uploadId}/pdf`,
      pdfDownloadFilename(filename, result.uploadId),
    );

    setSummary({
      calculatedCount: result.calculatedCount,
      errorCount: result.errorCount,
      uploadId: result.uploadId,
    });
    setStatus("done");

    toast.success(
      "Upload calculated",
      `${result.calculatedCount} row(s) calculated. The results PDF has been downloaded.`,
    );
  }

  function handleReset() {
    setStatus("idle");
    setRows([]);
    setHeaderError(undefined);
    setFilename("");
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const validCount = rows.filter((r) => !r.error).length;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-black/10 p-6 dark:border-white/10">
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Upload CSV</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleChooseFileClick}
            disabled={status === "loading" || status === "calculating"}
            className="h-9 rounded-md bg-black px-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            Choose File
          </button>
          <span className="text-sm text-black/60 dark:text-white/60">
            {filename || "No file chosen"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {status === "loading" && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Reading file&hellip;
        </p>
      )}

      {headerError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {headerError}
        </p>
      )}

      {(status === "previewed" || status === "calculating") &&
        rows.length > 0 && (
          <>
            <p className="text-sm text-black/60 dark:text-white/60">
              {validCount} of {rows.length} row(s) look valid.
            </p>
            <div className="max-h-72 overflow-auto rounded-lg border border-black/10 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-black/5 dark:bg-white/10">
                  <tr>
                    <th className="px-2 py-1.5">#</th>
                    <th className="px-2 py-1.5">Name</th>
                    <th className="px-2 py-1.5">Email</th>
                    <th className="px-2 py-1.5">Department</th>
                    <th className="px-2 py-1.5">Qual.</th>
                    <th className="px-2 py-1.5">Exp.</th>
                    <th className="px-2 py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className="border-t border-black/5 dark:border-white/10"
                    >
                      <td className="px-2 py-1.5">{row.rowNumber}</td>
                      <td className="px-2 py-1.5">{row.name}</td>
                      <td className="px-2 py-1.5">{row.email}</td>
                      <td className="px-2 py-1.5">{row.department}</td>
                      <td className="px-2 py-1.5">{row.qualification}</td>
                      <td className="px-2 py-1.5">
                        {row.experienceYears ?? "?"}y{" "}
                        {row.experienceMonths ?? "?"}m
                      </td>
                      <td
                        className={`px-2 py-1.5 ${
                          row.error
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {row.error ?? "OK"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={status === "calculating" || validCount === 0}
                className="h-10 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {status === "calculating"
                  ? "Calculating…"
                  : "Approve & calculate"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={status === "calculating"}
                className="h-10 rounded-md border border-black/15 px-4 text-sm dark:border-white/20"
              >
                Cancel
              </button>
            </div>
          </>
        )}

      {status === "done" && summary && (
        <div className="rounded-lg bg-black/5 p-4 text-sm dark:bg-white/10">
          <p>
            Calculated {summary.calculatedCount} row(s)
            {summary.errorCount > 0
              ? `, ${summary.errorCount} row(s) had errors`
              : ""}
            . The results PDF has been downloaded.
          </p>
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            Upload ID: {summary.uploadId}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-3 text-sm underline underline-offset-4"
          >
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
}
