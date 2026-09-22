"use client";

import { useState, type ReactNode } from "react";
import Calculator from "@/app/Calculator";
import CsvUploadForm from "@/components/CsvUploadForm";
import DownloadTemplateButton from "@/components/DownloadTemplateButton";

type Mode = "manual" | "csv";

export default function CalculatorTabs({
  departments,
}: {
  departments: { id: number; name: string }[];
}) {
  const [mode, setMode] = useState<Mode>("manual");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-black/10 p-1 dark:border-white/10">
          <TabButton active={mode === "manual"} onClick={() => setMode("manual")}>
            Manual entry
          </TabButton>
          <TabButton active={mode === "csv"} onClick={() => setMode("csv")}>
            Upload CSV
          </TabButton>
        </div>
        <DownloadTemplateButton />
      </div>

      {mode === "manual" ? (
        <Calculator departments={departments} />
      ) : (
        <CsvUploadForm />
      )}
    </div>
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
