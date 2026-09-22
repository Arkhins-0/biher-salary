import { getCsvUpload } from "@/lib/devQueries";
import { generateCsvUploadPdf } from "@/lib/csvPdf";
import { pdfDownloadFilename } from "@/lib/pdfFilename";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const upload = await getCsvUpload(id);
  if (!upload) {
    return new Response("Upload not found.", { status: 404 });
  }

  const pdfBytes = await generateCsvUploadPdf({
    uuid: upload.id,
    filename: upload.filename,
    createdAt: upload.createdAt,
    data: upload.data,
  });

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfDownloadFilename(upload.filename, upload.id)}"`,
    },
  });
}
