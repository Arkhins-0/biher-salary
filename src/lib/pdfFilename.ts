// No Node-only imports here (unlike csvPdf.ts) so this can be safely
// imported from Client Components too, to set the <a download> attribute
// to the same name the server sends via Content-Disposition.
export function pdfDownloadFilename(filename: string, uuid: string): string {
  const base = filename.replace(/\.csv$/i, "").replace(/[^\w-]+/g, "_");
  return `${base || "salary-results"}-${uuid}.pdf`;
}
