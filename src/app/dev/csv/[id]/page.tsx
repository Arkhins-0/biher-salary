import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDev } from "@/lib/auth";
import { getCsvUpload } from "@/lib/devQueries";
import { formatDateTime } from "@/lib/format";
import { pdfDownloadFilename } from "@/lib/pdfFilename";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function CsvUploadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDev();

  const { id } = await params;
  const upload = await getCsvUpload(id);
  if (!upload) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-xl font-semibold">{upload.filename}</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Uploaded {formatDateTime(upload.createdAt)} &middot;{" "}
              {upload.rowCount} row(s)
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <a
            href={`/api/csv-uploads/${upload.id}/pdf`}
            download={pdfDownloadFilename(upload.filename, upload.id)}
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Download PDF
          </a>
          <Link
            href="/dev"
            className="text-sm text-black/60 underline-offset-4 hover:underline dark:text-white/60"
          >
            Back to Dev Dashboard
          </Link>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/10">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Qual.</th>
              <th className="px-3 py-2">Experience</th>
              <th className="px-3 py-2">Salary</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {upload.data.map((row) => (
              <tr
                key={row.rowNumber}
                className="border-t border-black/5 dark:border-white/10"
              >
                <td className="px-3 py-2">{row.rowNumber}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">{row.department}</td>
                <td className="px-3 py-2">{row.qualification}</td>
                <td className="px-3 py-2">
                  {row.experienceYears ?? "?"}y {row.experienceMonths ?? "?"}m
                </td>
                <td className="px-3 py-2">
                  {row.salary !== null
                    ? `₹${row.salary.toLocaleString("en-IN")}`
                    : "—"}
                </td>
                <td
                  className={`px-3 py-2 ${
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
    </main>
  );
}
