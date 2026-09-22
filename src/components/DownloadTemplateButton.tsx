"use client";

import {
  CSV_TEMPLATE_HEADERS,
  CSV_TEMPLATE_EXAMPLE_ROW,
  stringifyCsv,
} from "@/lib/csv";
import { PHD_EXPERIENCE_NOTICE } from "@/lib/salary";
import {
  useConfirm,
  useToast,
} from "@/components/notifications/NotificationsProvider";

export default function DownloadTemplateButton() {
  const confirm = useConfirm();
  const toast = useToast();

  async function handleDownload() {
    const approved = await confirm({
      title: "PhD experience notice",
      description: PHD_EXPERIENCE_NOTICE,
      confirmLabel: "Download template",
    });
    if (!approved) return;

    const csv = stringifyCsv([
      [...CSV_TEMPLATE_HEADERS],
      CSV_TEMPLATE_EXAMPLE_ROW,
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "salary-upload-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(
      "Template downloaded",
      "salary-upload-template.csv has been saved.",
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="h-9 shrink-0 rounded-md border border-black/15 px-3 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
    >
      Download CSV template
    </button>
  );
}
