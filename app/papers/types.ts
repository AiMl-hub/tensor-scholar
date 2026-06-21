import type { VenueArea } from "@/app/lib/venues";

export type SearchField = "all" | "title" | "abstract" | "titleAbstract" | "author";
export type SortMode = "relevance" | "newest" | "citations";
export type Status = "idle" | "loading" | "success" | "error";
export type DateWindowPreset = "6m" | "1y" | "2y" | "3y" | "5y" | "custom";
export type PageSize = 5 | 10 | 20 | 50 | 100;
export type ResultLimit = 100 | 250 | 500;
export type ExportFormat = "bibtex" | "ris" | "csv";
export type SourceName = "OpenAlex" | "Semantic Scholar" | "Paper Digest";

export type DateWindow = {
  fromDate: string;
  toDate: string;
};

export type Paper = {
  id: string;
  title: string;
  abstract: string | null;
  highlight: string | null;
  authors: string[];
  venue: string;
  venueKey: string;
  venueLabel: string;
  area: VenueArea;
  rank: "A*" | "A";
  year: number | null;
  publicationDate: string | null;
  citationCount: number;
  influentialCitationCount: number | null;
  url: string | null;
  pdfUrl: string | null;
  doi: string | null;
  source: SourceName;
  score: number;
};

export type SearchMeta = {
  query: string;
  field: SearchField;
  sort: SortMode;
  selectedVenues: string[];
  fromDate: string;
  toDate: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  maxResults: number;
  sourceCounts: Record<SourceName, number>;
  errors: string[];
};

export type SearchPayload = {
  papers: Paper[];
  meta: SearchMeta;
};
