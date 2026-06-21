import type { VenueArea } from "@/app/lib/venues";
import type {
  DateWindowPreset,
  ExportFormat,
  PageSize,
  ResultLimit,
  SearchField,
  SortMode,
} from "@/app/papers/types";

export const FIELD_OPTIONS: Array<{ value: SearchField; label: string }> = [
  { value: "all", label: "All" },
  { value: "title", label: "Title" },
  { value: "abstract", label: "Abstract" },
  { value: "titleAbstract", label: "Title+Abs" },
  { value: "author", label: "Author" },
];

export const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "relevance", label: "Hybrid rank" },
  { value: "newest", label: "Newest" },
  { value: "citations", label: "Citations" },
];

export const EXPORT_OPTIONS: Array<{ value: ExportFormat; label: string }> = [
  { value: "bibtex", label: "BibTeX" },
  { value: "ris", label: "Zotero/Mendeley" },
  { value: "csv", label: "CSV" },
];

export const WINDOW_PRESETS: Array<{
  value: Exclude<DateWindowPreset, "custom">;
  label: string;
  months: number;
}> = [
  { value: "6m", label: "6 months", months: 6 },
  { value: "1y", label: "1 year", months: 12 },
  { value: "2y", label: "2 years", months: 24 },
  { value: "3y", label: "3 years", months: 36 },
  { value: "5y", label: "5 years", months: 60 },
];

export const PAGE_SIZE_OPTIONS: PageSize[] = [5, 10, 20, 50, 100];
export const RESULT_LIMIT_OPTIONS: ResultLimit[] = [100, 250, 500];

export const SAMPLE_QUERIES = [
  "vision language models",
  "retrieval augmented generation",
  "agentic ai",
  "federated learning",
];

export const AREA_STYLES: Record<VenueArea, string> = {
  ml: "border-blue-200 bg-blue-50 text-blue-950",
  cv: "border-sky-200 bg-sky-50 text-sky-950",
  nlp: "border-indigo-200 bg-indigo-50 text-indigo-950",
  ai: "border-yellow-200 bg-yellow-50 text-yellow-950",
  medical: "border-cyan-200 bg-cyan-50 text-cyan-950",
};
