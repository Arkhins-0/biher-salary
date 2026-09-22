import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { CsvUploadResultRow } from "./csv";
import { formatDateTime } from "./format";

// pdf-lib's standard fonts only support WinAnsi (roughly Latin-1). Anything
// outside that range (₹, non-Latin names, emoji, ...) throws at draw time,
// so replace it rather than let PDF generation crash on unexpected input.
function sanitizeForPdf(text: string): string {
  return text.replace(/[^\x00-\xFF]/g, "?");
}

function formatSalaryForPdf(salary: number | null): string {
  if (salary === null) return "-";
  return `Rs. ${salary.toLocaleString("en-IN")}`;
}

function fitText(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number,
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (
    truncated.length > 0 &&
    font.widthOfTextAtSize(truncated + "..", size) > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length > 0 ? truncated + ".." : "..";
}

const PAGE_WIDTH = 841.89; // A4 landscape
const PAGE_HEIGHT = 595.28;
const MARGIN = 36;
const HEADER_HEIGHT = 80;
const FOOTER_HEIGHT = 30;
const ROW_HEIGHT = 16;
const HEADER_ROW_HEIGHT = 18;

const COLUMNS = [
  { label: "#", frac: 0.03 },
  { label: "Name", frac: 0.14 },
  { label: "Email", frac: 0.19 },
  { label: "Department", frac: 0.13 },
  { label: "Qual.", frac: 0.06 },
  { label: "Experience", frac: 0.1 },
  { label: "Salary", frac: 0.11 },
  { label: "Status", frac: 0.24 },
];

export interface CsvUploadPdfInput {
  uuid: string;
  filename: string;
  createdAt: Date;
  data: CsvUploadResultRow[];
}

export async function generateCsvUploadPdf({
  uuid,
  filename,
  createdAt,
  data,
}: CsvUploadPdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = await readFile(
    path.join(process.cwd(), "public", "logo.jpeg"),
  );
  const logoImage = await pdfDoc.embedJpg(logoBytes);
  const logoHeight = 44;
  const logoWidth = logoHeight * (logoImage.width / logoImage.height);

  const availableWidth = PAGE_WIDTH - MARGIN * 2;
  const columns = COLUMNS.map((c) => ({
    ...c,
    width: c.frac * availableWidth,
  }));

  const rows = data.map((row) => [
    String(row.rowNumber),
    sanitizeForPdf(row.name),
    sanitizeForPdf(row.email),
    sanitizeForPdf(row.department),
    sanitizeForPdf(row.qualification),
    `${row.experienceYears ?? "?"}y ${row.experienceMonths ?? "?"}m`,
    formatSalaryForPdf(row.salary),
    sanitizeForPdf(row.error ?? "OK"),
  ]);

  const tableTop = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT;
  const tableBottom = MARGIN + FOOTER_HEIGHT;
  const rowsPerPage = Math.max(
    1,
    Math.floor((tableTop - tableBottom - HEADER_ROW_HEIGHT) / ROW_HEIGHT),
  );

  const pages: string[][][] = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage));
  }
  if (pages.length === 0) pages.push([]);
  const totalPages = pages.length;

  const safeFilename = sanitizeForPdf(filename);

  pages.forEach((pageRows, pageIndex) => {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Header: college logo + report title/meta
    page.drawImage(logoImage, {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
    const textX = MARGIN + logoWidth + 16;
    page.drawText("Salary Calculation Report", {
      x: textX,
      y: PAGE_HEIGHT - MARGIN - 16,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(`File: ${safeFilename}`, {
      x: textX,
      y: PAGE_HEIGHT - MARGIN - 34,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(`Generated: ${formatDateTime(createdAt)}`, {
      x: textX,
      y: PAGE_HEIGHT - MARGIN - 48,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawLine({
      start: { x: MARGIN, y: tableTop + 10 },
      end: { x: PAGE_WIDTH - MARGIN, y: tableTop + 10 },
      thickness: 0.75,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Table header row
    page.drawRectangle({
      x: MARGIN,
      y: tableTop - HEADER_ROW_HEIGHT,
      width: availableWidth,
      height: HEADER_ROW_HEIGHT,
      color: rgb(0.93, 0.93, 0.93),
    });
    let headerX = MARGIN;
    columns.forEach((col) => {
      page.drawText(col.label, {
        x: headerX + 4,
        y: tableTop - HEADER_ROW_HEIGHT + 5,
        size: 9,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      headerX += col.width;
    });

    // Data rows
    let y = tableTop - HEADER_ROW_HEIGHT;
    pageRows.forEach((rowValues, rowIdx) => {
      y -= ROW_HEIGHT;
      if (rowIdx % 2 === 1) {
        page.drawRectangle({
          x: MARGIN,
          y,
          width: availableWidth,
          height: ROW_HEIGHT,
          color: rgb(0.97, 0.97, 0.97),
        });
      }
      let cellX = MARGIN;
      rowValues.forEach((value, colIdx) => {
        const col = columns[colIdx];
        page.drawText(fitText(font, value, 8, col.width - 8), {
          x: cellX + 4,
          y: y + 4,
          size: 8,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
        cellX += col.width;
      });
    });

    page.drawRectangle({
      x: MARGIN,
      y: tableBottom,
      width: availableWidth,
      height: tableTop - tableBottom,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.75,
    });

    // Footer: page number + upload UUID
    page.drawText(`Page ${pageIndex + 1} of ${totalPages}`, {
      x: MARGIN,
      y: MARGIN + 10,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    const uuidText = `Upload ID: ${uuid}`;
    const uuidWidth = font.widthOfTextAtSize(uuidText, 8);
    page.drawText(uuidText, {
      x: PAGE_WIDTH - MARGIN - uuidWidth,
      y: MARGIN + 10,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  return pdfDoc.save();
}
