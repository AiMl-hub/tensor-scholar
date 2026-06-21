import { AREA_LABELS } from "@/app/lib/venues";
import type { ExportFormat, Paper } from "@/app/papers/types";
import { toIsoDate } from "@/app/papers/lib/date";

export function downloadPaperExport(papers: Paper[], format: ExportFormat) {
  const timestamp = toIsoDate(new Date());
  const filenameBase = `tensor-scholar-${timestamp}`;

  if (format === "bibtex") {
    downloadTextFile(`${filenameBase}.bib`, "application/x-bibtex", toBibtex(papers));
    return;
  }

  if (format === "ris") {
    downloadTextFile(`${filenameBase}.ris`, "application/x-research-info-systems", toRis(papers));
    return;
  }

  downloadTextFile(`${filenameBase}.csv`, "text/csv", toCsv(papers));
}

function toBibtex(papers: Paper[]) {
  return papers
    .map((paper, index) => {
      const fields: Array<[string, string | null | undefined]> = [
        ["title", paper.title],
        ["author", paper.authors.join(" and ")],
        ["booktitle", paper.venue],
        ["year", paper.year ? String(paper.year) : null],
        ["date", paper.publicationDate],
        ["doi", paper.doi],
        ["url", paper.url],
        ["pdf", paper.pdfUrl],
        ["abstract", paper.abstract ?? paper.highlight],
        ["annote", paper.highlight],
        ["note", `${paper.venueLabel} ${paper.rank}; source: ${paper.source}`],
      ];

      const body = fields
        .filter(([, value]) => Boolean(value))
        .map(([key, value]) => `  ${key} = {${escapeBibtexValue(value ?? "")}}`)
        .join(",\n");

      return `@inproceedings{${getCitationKey(paper, index)},\n${body}\n}`;
    })
    .join("\n\n");
}

function toRis(papers: Paper[]) {
  return papers
    .map((paper) => {
      const lines = [
        "TY  - CONF",
        `TI  - ${escapeRisValue(paper.title)}`,
        ...paper.authors.map((author) => `AU  - ${escapeRisValue(author)}`),
        paper.venue ? `T2  - ${escapeRisValue(paper.venue)}` : null,
        paper.year ? `PY  - ${paper.year}` : null,
        paper.publicationDate ? `Y1  - ${paper.publicationDate}` : null,
        paper.doi ? `DO  - ${escapeRisValue(paper.doi)}` : null,
        paper.url ? `UR  - ${escapeRisValue(paper.url)}` : null,
        paper.pdfUrl ? `L1  - ${escapeRisValue(paper.pdfUrl)}` : null,
        paper.abstract || paper.highlight
          ? `N2  - ${escapeRisValue(paper.abstract ?? paper.highlight ?? "")}`
          : null,
        paper.highlight ? `N1  - ${escapeRisValue(`Highlight: ${paper.highlight}`)}` : null,
        `N1  - ${escapeRisValue(`${paper.venueLabel} ${paper.rank}; source: ${paper.source}`)}`,
        "ER  -",
      ];

      return lines.filter(Boolean).join("\r\n");
    })
    .join("\r\n\r\n");
}

function toCsv(papers: Paper[]) {
  const columns: Array<[string, (paper: Paper) => string | number | null]> = [
    ["title", (paper) => paper.title],
    ["authors", (paper) => paper.authors.join("; ")],
    ["venue", (paper) => paper.venue],
    ["venueLabel", (paper) => paper.venueLabel],
    ["rank", (paper) => paper.rank],
    ["area", (paper) => AREA_LABELS[paper.area]],
    ["year", (paper) => paper.year],
    ["publicationDate", (paper) => paper.publicationDate],
    ["doi", (paper) => paper.doi],
    ["url", (paper) => paper.url],
    ["pdfUrl", (paper) => paper.pdfUrl],
    ["citationCount", (paper) => paper.citationCount],
    ["source", (paper) => paper.source],
    ["highlight", (paper) => paper.highlight],
    ["abstract", (paper) => paper.abstract],
  ];

  const header = columns.map(([name]) => csvCell(name)).join(",");
  const rows = papers.map((paper) =>
    columns.map(([, getter]) => csvCell(getter(paper))).join(","),
  );

  return [header, ...rows].join("\r\n");
}

function downloadTextFile(filename: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getCitationKey(paper: Paper, index: number) {
  const leadAuthor = paper.authors[0]?.split(/\s+/).at(-1) ?? "paper";
  const titleTokens = paper.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token.length > 2)
    .slice(0, 3)
    .map((token) => token[0].toUpperCase() + token.slice(1))
    .join("");

  return sanitizeCitationKey(`${leadAuthor}${paper.year ?? "nd"}${titleTokens}${index + 1}`);
}

function sanitizeCitationKey(value: string) {
  return value.replace(/[^A-Za-z0-9:_-]/g, "") || "tensorScholarPaper";
}

function escapeBibtexValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/([{}_%&#$])/g, "\\$1")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRisValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
