"use client";

import Image from "next/image";
import { FormEvent, Fragment, useMemo, useState } from "react";
import {
  AREA_LABELS,
  DEFAULT_VENUE_KEYS,
  VENUES,
  type VenueArea,
} from "@/app/lib/venues";

type SearchField = "all" | "title" | "abstract" | "titleAbstract" | "author";
type SortMode = "relevance" | "newest" | "citations";
type Status = "idle" | "loading" | "success" | "error";
type DateWindowPreset = "6m" | "1y" | "2y" | "3y" | "5y" | "custom";
type PageSize = 5 | 10 | 20 | 50 | 100;
type ResultLimit = 100 | 250 | 500;

type DateWindow = {
  fromDate: string;
  toDate: string;
};

type ExportFormat = "bibtex" | "ris" | "csv";

type Paper = {
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
  source: "OpenAlex" | "Semantic Scholar" | "Paper Digest";
  score: number;
};

type SearchMeta = {
  query: string;
  field: SearchField;
  sort: SortMode;
  selectedVenues: string[];
  fromDate: string;
  toDate: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  maxResults: number;
  errors: string[];
};

type SearchPayload = {
  papers: Paper[];
  meta: SearchMeta;
};

const FIELD_OPTIONS: Array<{ value: SearchField; label: string }> = [
  { value: "all", label: "All" },
  { value: "title", label: "Title" },
  { value: "abstract", label: "Abstract" },
  { value: "titleAbstract", label: "Title+Abs" },
  { value: "author", label: "Author" },
];

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "relevance", label: "Hybrid rank" },
  { value: "newest", label: "Newest" },
  { value: "citations", label: "Citations" },
];

const WINDOW_PRESETS: Array<{
  value: Exclude<DateWindowPreset, "custom">;
  label: string;
  months: number;
}> = [
  { value: "6m", label: "6M", months: 6 },
  { value: "1y", label: "1Y", months: 12 },
  { value: "2y", label: "2Y", months: 24 },
  { value: "3y", label: "3Y", months: 36 },
  { value: "5y", label: "5Y", months: 60 },
];

const PAGE_SIZE_OPTIONS: PageSize[] = [5, 10, 20, 50, 100];
const RESULT_LIMIT_OPTIONS: ResultLimit[] = [100, 250, 500];

const SAMPLE_QUERIES = [
  "vision language models",
  "retrieval augmented generation",
  "agentic ai",
  "federated learning",
];

const AREA_STYLES: Record<VenueArea, string> = {
  ml: "border-emerald-200 bg-emerald-50 text-emerald-900",
  cv: "border-cyan-200 bg-cyan-50 text-cyan-900",
  nlp: "border-rose-200 bg-rose-50 text-rose-900",
  ai: "border-amber-200 bg-amber-50 text-amber-950",
};

export default function PaperSearchApp() {
  const defaultWindow = useMemo(() => getDefaultDateWindow(), []);
  const [query, setQuery] = useState("");
  const [includeKeywords, setIncludeKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");
  const [field, setField] = useState<SearchField>("all");
  const [sort, setSort] = useState<SortMode>("relevance");
  const [dateWindow, setDateWindow] = useState<DateWindow>(defaultWindow);
  const [windowPreset, setWindowPreset] = useState<DateWindowPreset>("2y");
  const [selectedVenues, setSelectedVenues] = useState<string[]>(DEFAULT_VENUE_KEYS);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(() => new Set());
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [maxResults, setMaxResults] = useState<ResultLimit>(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const groupedVenues = useMemo(() => {
    return VENUES.reduce<Record<VenueArea, typeof VENUES>>(
      (groups, venue) => {
        groups[venue.area].push(venue);
        return groups;
      },
      { ml: [], cv: [], nlp: [], ai: [] },
    );
  }, []);

  const selectedVenueSet = useMemo(() => new Set(selectedVenues), [selectedVenues]);
  const pageCount = Math.max(1, Math.ceil(papers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStart = papers.length ? (safeCurrentPage - 1) * pageSize : 0;
  const visiblePapers = papers.slice(pageStart, pageStart + pageSize);
  const selectedPapers = useMemo(
    () => papers.filter((paper) => selectedPaperIds.has(getPaperKey(paper))),
    [papers, selectedPaperIds],
  );

  async function runSearch(
    nextQuery = query,
    nextSort = sort,
    nextWindow = dateWindow,
    nextMaxResults = maxResults,
  ) {
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      setPapers([]);
      setSelectedPaperIds(new Set());
      setCurrentPage(1);
      setMeta(null);
      setStatus("idle");
      setError("");
      return;
    }

    if (!isValidDateWindow(nextWindow)) {
      setPapers([]);
      setSelectedPaperIds(new Set());
      setCurrentPage(1);
      setMeta(null);
      setStatus("error");
      setError("Choose a valid date window.");
      return;
    }

    setStatus("loading");
    setError("");

    const params = new URLSearchParams({
      q: trimmed,
      field,
      sort: nextSort,
      fromDate: nextWindow.fromDate,
      toDate: nextWindow.toDate,
      venues: selectedVenues.join(","),
      include: includeKeywords,
      exclude: excludeKeywords,
      limit: String(nextMaxResults),
    });

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Search failed with ${response.status}`);
      }

      const payload = (await response.json()) as SearchPayload;
      setPapers(payload.papers);
      setCurrentPage(1);
      setSelectedPaperIds((current) => {
        const nextPaperIds = new Set(payload.papers.map(getPaperKey));
        return new Set([...current].filter((id) => nextPaperIds.has(id)));
      });
      setMeta(payload.meta);
      setStatus("success");
    } catch {
      setPapers([]);
      setSelectedPaperIds(new Set());
      setCurrentPage(1);
      setMeta(null);
      setError("Search is unavailable right now.");
      setStatus("error");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch();
  }

  function updateSort(nextSort: SortMode) {
    setSort(nextSort);
    if (query.trim()) {
      void runSearch(query, nextSort, dateWindow);
    }
  }

  function applyWindowPreset(preset: Exclude<DateWindowPreset, "custom">) {
    const presetConfig = WINDOW_PRESETS.find((option) => option.value === preset);
    if (!presetConfig) {
      return;
    }

    const nextWindow = getDateWindowForMonths(presetConfig.months);
    setWindowPreset(preset);
    setDateWindow(nextWindow);

    if (query.trim()) {
      void runSearch(query, sort, nextWindow);
    }
  }

  function updateDateWindow(part: keyof DateWindow, value: string) {
    setWindowPreset("custom");
    setDateWindow((current) => ({ ...current, [part]: value }));
  }

  function toggleVenue(key: string) {
    setSelectedVenues((current) => {
      if (current.includes(key)) {
        return current.length === 1 ? current : current.filter((item) => item !== key);
      }

      return [...current, key];
    });
  }

  function selectArea(area: VenueArea) {
    const areaKeys = groupedVenues[area].map((venue) => venue.key);
    setSelectedVenues((current) => Array.from(new Set([...current, ...areaKeys])));
  }

  function togglePaperSelection(paper: Paper) {
    const paperKey = getPaperKey(paper);
    setSelectedPaperIds((current) => {
      const next = new Set(current);
      if (next.has(paperKey)) {
        next.delete(paperKey);
      } else {
        next.add(paperKey);
      }

      return next;
    });
  }

  function selectAllVisiblePapers() {
    setSelectedPaperIds((current) => {
      const next = new Set(current);
      for (const paper of visiblePapers) {
        next.add(getPaperKey(paper));
      }

      return next;
    });
  }

  function updatePageSize(nextPageSize: PageSize) {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  }

  function updateMaxResults(nextMaxResults: ResultLimit) {
    setMaxResults(nextMaxResults);
    setCurrentPage(1);

    if (query.trim()) {
      void runSearch(query, sort, dateWindow, nextMaxResults);
    }
  }

  function clearSelection() {
    setSelectedPaperIds(new Set());
  }

  function exportSelected(format: ExportFormat) {
    if (!selectedPapers.length) {
      return;
    }

    const timestamp = toIsoDate(new Date());
    const filenameBase = `tensor-scholar-${timestamp}`;

    if (format === "bibtex") {
      downloadTextFile(`${filenameBase}.bib`, "application/x-bibtex", toBibtex(selectedPapers));
      return;
    }

    if (format === "ris") {
      downloadTextFile(`${filenameBase}.ris`, "application/x-research-info-systems", toRis(selectedPapers));
      return;
    }

    downloadTextFile(`${filenameBase}.csv`, "text/csv", toCsv(selectedPapers));
  }

  const highlightQuery = meta
    ? [meta.query, ...meta.includeKeywords].join(" ")
    : [query, includeKeywords].join(" ");

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#1b1c1a]">
      <section className="border-b border-[#cdd8cf] bg-[#e8f2eb]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-[#54615a]">
                A*/A conference search
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Image
                  alt=""
                  aria-hidden="true"
                  className="h-9 w-9 shrink-0 rounded-md sm:h-10 sm:w-10"
                  height={40}
                  src="/favicon.svg"
                  width={40}
                />
                <h1 className="nes-title text-3xl text-[#18211c] sm:text-4xl">
                  Tensor Scholar
                </h1>
              </div>
            </div>
          </div>

          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
            <div className="flex min-h-12 w-full min-w-0 overflow-hidden rounded-lg border border-[#b8c7be] bg-white transition focus-within:border-[#1d8a6c] focus-within:ring-2 focus-within:ring-[#93d7c0]">
              <label className="sr-only" htmlFor="search-field">
                Search field
              </label>
              <select
                className="min-h-12 w-[120px] shrink-0 border-r border-[#c8d3cc] bg-[#f8fbf9] px-3 text-sm font-semibold text-[#25302a] outline-none sm:w-[150px]"
                id="search-field"
                onChange={(event) => setField(event.target.value as SearchField)}
                value={field}
              >
                {FIELD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="paper-query">
                Paper search
              </label>
              <input
                id="paper-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-base outline-none"
                placeholder="Search papers"
              />
            </div>
            <button
              className="h-12 rounded-lg bg-[#176f5b] px-6 font-semibold text-white shadow-sm transition hover:bg-[#115744] focus:outline-none focus:ring-2 focus:ring-[#93d7c0] disabled:cursor-not-allowed disabled:bg-[#8aa39a]"
              disabled={status === "loading"}
              type="submit"
            >
              {status === "loading" ? "Searching" : "Search"}
            </button>
            <KeywordFilters
              excludeKeywords={excludeKeywords}
              includeKeywords={includeKeywords}
              maxResults={maxResults}
              onExcludeChange={setExcludeKeywords}
              onIncludeChange={setIncludeKeywords}
              onMaxResultsChange={updateMaxResults}
            />
          </form>

          <WindowControls
            dateWindow={dateWindow}
            isValid={isValidDateWindow(dateWindow)}
            onDateChange={updateDateWindow}
            onPreset={applyWindowPreset}
            preset={windowPreset}
            today={defaultWindow.toDate}
          />

          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((sample) => (
              <button
                className="rounded-md border border-[#c8d3cc] bg-white px-3 py-2 text-sm font-medium text-[#344139] transition hover:border-[#176f5b] hover:text-[#176f5b]"
                key={sample}
                onClick={() => {
                  setQuery(sample);
                  void runSearch(sample);
                }}
                type="button"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-lg border border-[#d6ddd8] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase text-[#49534d]">Sources</h2>
              <p className="mt-1 text-xs font-semibold text-[#65716a]">
                {selectedVenues.length}/{VENUES.length} venues
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-[#cbd6d0] px-2 py-1 text-xs font-semibold text-[#47534c] hover:border-[#176f5b] hover:text-[#176f5b]"
                onClick={() => setSelectedVenues(DEFAULT_VENUE_KEYS)}
                type="button"
              >
                All
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {(Object.keys(groupedVenues) as VenueArea[]).map((area) => (
              <section key={area}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#25302a]">{AREA_LABELS[area]}</h3>
                  <button
                    className="text-xs font-semibold text-[#176f5b] hover:text-[#0f4c3d]"
                    onClick={() => selectArea(area)}
                    type="button"
                  >
                    Select
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupedVenues[area].map((venue) => {
                    const active = selectedVenueSet.has(venue.key);
                    return (
                      <button
                        aria-pressed={active}
                        className={[
                          "rounded-md border px-2.5 py-1.5 text-xs font-semibold transition",
                          active
                            ? AREA_STYLES[venue.area]
                            : "border-[#d6ddd8] bg-[#fafbf8] text-[#626d66] hover:border-[#176f5b]",
                        ].join(" ")}
                        key={venue.key}
                        onClick={() => toggleVenue(venue.key)}
                        title={`${venue.fullName} (${venue.rank})`}
                        type="button"
                      >
                        {venue.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[#d6ddd8] bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#25302a]">
                {status === "success"
                  ? `${papers.length} papers`
                  : status === "loading"
                    ? "Searching"
                    : "Ready"}
              </p>
            </div>
            <SegmentedControl<SortMode>
              label="Sort"
              options={SORT_OPTIONS}
              stackUntilLarge
              value={sort}
              onChange={updateSort}
            />
          </div>

          {meta?.errors.length ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              {meta.errors.join(" ")}
            </div>
          ) : null}

          {papers.length > 0 ? (
            <PaginationControls
              currentPage={safeCurrentPage}
              onPageChange={(page) => setCurrentPage(Math.max(1, Math.min(page, pageCount)))}
              onPageSizeChange={updatePageSize}
              pageCount={pageCount}
              pageSize={pageSize}
              pageStart={pageStart}
              totalCount={papers.length}
              visibleCount={visiblePapers.length}
            />
          ) : null}

          {papers.length > 0 ? (
            <SelectionToolbar
              onClear={clearSelection}
              onExport={exportSelected}
              onSelectAll={selectAllVisiblePapers}
              selectedCount={selectedPapers.length}
              totalCount={visiblePapers.length}
            />
          ) : null}

          {status === "loading" ? <LoadingState /> : null}
          {status === "error" ? <ErrorState message={error} /> : null}
          {status === "success" && papers.length === 0 ? <EmptyState /> : null}

          {papers.length > 0 ? (
            <div className="space-y-3">
              {visiblePapers.map((paper) => (
                <PaperResult
                  isSelected={selectedPaperIds.has(getPaperKey(paper))}
                  key={`${paper.source}-${paper.id}`}
                  onToggleSelection={togglePaperSelection}
                  paper={paper}
                  query={highlightQuery}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <footer className="border-t border-[#cdd8cf] bg-[#e8f2eb]">
        <div className="nes-title mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-[#18211c] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Copyright 2026 Mai A. Shaaban</p>
          <div className="flex flex-wrap gap-3">
            <a
              className="text-[#176f5b] hover:text-[#0f4c3d]"
              href="https://www.linkedin.com/in/maiahmed"
              rel="noreferrer"
              target="_blank"
            >
              LinkedIn
            </a>
            <a
              className="text-[#176f5b] hover:text-[#0f4c3d]"
              href="https://mai-cs.github.io"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function WindowControls({
  dateWindow,
  isValid,
  onDateChange,
  onPreset,
  preset,
  today,
}: {
  dateWindow: DateWindow;
  isValid: boolean;
  onDateChange: (part: keyof DateWindow, value: string) => void;
  onPreset: (preset: Exclude<DateWindowPreset, "custom">) => void;
  preset: DateWindowPreset;
  today: string;
}) {
  return (
    <div className="rounded-lg border border-[#c8d3cc] bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[#65716a]">Date window</p>
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Date window presets">
            {WINDOW_PRESETS.map((option) => {
              const active = preset === option.value;
              return (
                <button
                  aria-pressed={active}
                  className={[
                    "min-h-9 rounded-md border px-3 text-sm font-semibold transition",
                    active
                      ? "border-[#176f5b] bg-[#1d6f5c] text-white"
                      : "border-[#c8d3cc] text-[#405047] hover:border-[#176f5b] hover:text-[#176f5b]",
                  ].join(" ")}
                  key={option.value}
                  onClick={() => onPreset(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold uppercase text-[#65716a]" htmlFor="from-date">
            From
            <input
              className={[
                "h-10 rounded-md border bg-white px-3 text-sm font-medium text-[#25302a] outline-none transition focus:border-[#1d8a6c] focus:ring-2 focus:ring-[#93d7c0]",
                isValid ? "border-[#c8d3cc]" : "border-rose-300",
              ].join(" ")}
              id="from-date"
              max={dateWindow.toDate || today}
              onChange={(event) => onDateChange("fromDate", event.target.value)}
              type="date"
              value={dateWindow.fromDate}
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase text-[#65716a]" htmlFor="to-date">
            To
            <input
              className={[
                "h-10 rounded-md border bg-white px-3 text-sm font-medium text-[#25302a] outline-none transition focus:border-[#1d8a6c] focus:ring-2 focus:ring-[#93d7c0]",
                isValid ? "border-[#c8d3cc]" : "border-rose-300",
              ].join(" ")}
              id="to-date"
              max={today}
              min={dateWindow.fromDate}
              onChange={(event) => onDateChange("toDate", event.target.value)}
              type="date"
              value={dateWindow.toDate}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function KeywordFilters({
  excludeKeywords,
  includeKeywords,
  maxResults,
  onExcludeChange,
  onIncludeChange,
  onMaxResultsChange,
}: {
  excludeKeywords: string;
  includeKeywords: string;
  maxResults: ResultLimit;
  onExcludeChange: (value: string) => void;
  onIncludeChange: (value: string) => void;
  onMaxResultsChange: (value: ResultLimit) => void;
}) {
  return (
    <div className="grid gap-3 lg:col-span-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
      <label className="grid gap-1 text-xs font-semibold uppercase text-[#65716a]" htmlFor="include-keywords">
        Must include
        <input
          className="h-11 rounded-lg border border-[#b8c7be] bg-white px-3 text-sm font-medium text-[#25302a] outline-none transition focus:border-[#1d8a6c] focus:ring-2 focus:ring-[#93d7c0]"
          id="include-keywords"
          onChange={(event) => onIncludeChange(event.target.value)}
          placeholder="agentic, benchmark"
          type="text"
          value={includeKeywords}
        />
      </label>

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#65716a]" htmlFor="exclude-keywords">
        Exclude
        <input
          className="h-11 rounded-lg border border-[#b8c7be] bg-white px-3 text-sm font-medium text-[#25302a] outline-none transition focus:border-[#b15b65] focus:ring-2 focus:ring-[#f2b6bd]"
          id="exclude-keywords"
          onChange={(event) => onExcludeChange(event.target.value)}
          placeholder="survey, tutorial"
          type="text"
          value={excludeKeywords}
        />
      </label>

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#65716a]" htmlFor="max-results">
        Max results
        <select
          className="h-11 rounded-lg border border-[#b8c7be] bg-white px-3 text-sm font-semibold text-[#25302a] outline-none transition focus:border-[#1d8a6c] focus:ring-2 focus:ring-[#93d7c0]"
          id="max-results"
          onChange={(event) => onMaxResultsChange(parseResultLimit(event.target.value))}
          value={maxResults}
        >
          {RESULT_LIMIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function SegmentedControl<T extends string>({
  label,
  options,
  stackUntilLarge = false,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  stackUntilLarge?: boolean;
  value: T;
  onChange: (value: T) => void;
}) {
  const controlWidthClass = stackUntilLarge ? "lg:w-auto" : "md:w-auto";
  const buttonWidthClass = stackUntilLarge ? "lg:flex-none" : "md:flex-none";

  return (
    <div
      aria-label={label}
      className={`flex w-full max-w-full overflow-hidden rounded-lg border border-[#c8d3cc] bg-white ${controlWidthClass}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            className={[
              "min-h-10 min-w-0 flex-1 truncate whitespace-nowrap px-2.5 text-sm font-semibold transition sm:px-3",
              buttonWidthClass,
              active ? "bg-[#1d6f5c] text-white" : "text-[#405047] hover:bg-[#eef5f0]",
            ].join(" ")}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PaginationControls({
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageCount,
  pageSize,
  pageStart,
  totalCount,
  visibleCount,
}: {
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
  pageCount: number;
  pageSize: PageSize;
  pageStart: number;
  totalCount: number;
  visibleCount: number;
}) {
  const firstVisible = totalCount ? pageStart + 1 : 0;
  const lastVisible = Math.min(pageStart + visibleCount, totalCount);

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[#d6ddd8] bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-semibold text-[#25302a]">
        Showing {firstVisible}-{lastVisible} of {totalCount}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#405047]" htmlFor="page-size">
          Per page
          <select
            className="h-10 rounded-md border border-[#c8d3cc] bg-white px-3 text-sm font-semibold text-[#25302a] outline-none transition focus:border-[#1d8a6c] focus:ring-2 focus:ring-[#93d7c0]"
            id="page-size"
            onChange={(event) => onPageSizeChange(parsePageSize(event.target.value))}
            value={pageSize}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-[auto_1fr_auto] items-center overflow-hidden rounded-lg border border-[#c8d3cc] bg-white">
          <button
            className="min-h-10 px-3 text-sm font-semibold text-[#176f5b] transition hover:bg-[#eef5f0] disabled:cursor-not-allowed disabled:text-[#9aa69f]"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            Prev
          </button>
          <span className="border-x border-[#c8d3cc] px-3 text-center text-sm font-semibold text-[#405047]">
            {currentPage}/{pageCount}
          </span>
          <button
            className="min-h-10 px-3 text-sm font-semibold text-[#176f5b] transition hover:bg-[#eef5f0] disabled:cursor-not-allowed disabled:text-[#9aa69f]"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectionToolbar({
  onClear,
  onExport,
  onSelectAll,
  selectedCount,
  totalCount,
}: {
  onClear: () => void;
  onExport: (format: ExportFormat) => void;
  onSelectAll: () => void;
  selectedCount: number;
  totalCount: number;
}) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="mb-4 rounded-lg border border-[#c8d3cc] bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#25302a]">
            {selectedCount} selected
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-10 rounded-md border border-[#c8d3cc] px-3 text-sm font-semibold text-[#176f5b] transition hover:border-[#176f5b]"
            onClick={onSelectAll}
            type="button"
          >
            Select page {totalCount}
          </button>
          <button
            className="min-h-10 rounded-md border border-[#c8d3cc] px-3 text-sm font-semibold text-[#5d6962] transition hover:border-[#176f5b] hover:text-[#176f5b] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!hasSelection}
            onClick={onClear}
            type="button"
          >
            Clear
          </button>
          <button
            className="min-h-10 rounded-md bg-[#176f5b] px-3 text-sm font-semibold text-white transition hover:bg-[#115744] disabled:cursor-not-allowed disabled:bg-[#8aa39a]"
            disabled={!hasSelection}
            onClick={() => onExport("bibtex")}
            type="button"
          >
            BibTeX
          </button>
          <button
            className="min-h-10 rounded-md bg-[#176f5b] px-3 text-sm font-semibold text-white transition hover:bg-[#115744] disabled:cursor-not-allowed disabled:bg-[#8aa39a]"
            disabled={!hasSelection}
            onClick={() => onExport("ris")}
            type="button"
          >
            Zotero/Mendeley
          </button>
          <button
            className="min-h-10 rounded-md border border-[#c8d3cc] px-3 text-sm font-semibold text-[#176f5b] transition hover:border-[#176f5b] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!hasSelection}
            onClick={() => onExport("csv")}
            type="button"
          >
            CSV
          </button>
        </div>
      </div>
    </div>
  );
}

function PaperResult({
  isSelected,
  onToggleSelection,
  paper,
  query,
}: {
  isSelected: boolean;
  onToggleSelection: (paper: Paper) => void;
  paper: Paper;
  query: string;
}) {
  const authors = paper.authors.slice(0, 8).join(", ");
  const extraAuthors = Math.max(0, paper.authors.length - 8);
  const highlight = paper.highlight ? trimAbstract(paper.highlight, 420) : null;

  return (
    <article
      className={[
        "rounded-lg border bg-white p-4 shadow-sm transition",
        isSelected ? "border-[#176f5b] ring-2 ring-[#93d7c0]" : "border-[#d6ddd8]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex w-fit items-center gap-2 rounded-md border border-[#c8d3cc] px-2.5 py-1.5 text-xs font-semibold text-[#25302a]">
              <input
                checked={isSelected}
                className="h-4 w-4 accent-[#176f5b]"
                onChange={() => onToggleSelection(paper)}
                type="checkbox"
              />
              Select
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge className={AREA_STYLES[paper.area]}>{paper.venueLabel}</Badge>
              <Badge className={paper.rank === "A*" ? "border-[#f2c35b] bg-[#fff3c4] text-[#6a4a00]" : "border-[#c9d4cc] bg-[#f4f7f2] text-[#435047]"}>
                {paper.rank}
              </Badge>
              {paper.year ? (
                <Badge className="border-[#c9d4cc] bg-[#f4f7f2] text-[#435047]">{String(paper.year)}</Badge>
              ) : null}
              {paper.doi ? (
                <BadgeLink
                  className="border-[#c9d4cc] bg-[#f4f7f2] text-[#176f5b] hover:border-[#176f5b]"
                  href={`https://doi.org/${paper.doi}`}
                >
                  DOI
                </BadgeLink>
              ) : null}
            </div>
          </div>

          <h2 className="text-lg font-semibold leading-snug text-[#151a17]">
            {paper.url ? (
              <a className="hover:text-[#176f5b]" href={paper.url} rel="noreferrer" target="_blank">
                <HighlightedText query={query} text={paper.title} />
              </a>
            ) : (
              <HighlightedText query={query} text={paper.title} />
            )}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#4f5b54]">
            {authors}
            {extraAuthors ? `, +${extraAuthors}` : ""}
          </p>
        </div>

        <div className="grid min-w-[128px] grid-cols-2 gap-2 text-center lg:grid-cols-1">
          <SmallStat label="Cites" value={String(paper.citationCount)} />
          <SmallStat label="Score" value={paper.score.toFixed(1)} />
        </div>
      </div>

      {highlight ? (
        <div className="mt-3 rounded-md border border-[#c7ded3] bg-[#f2faf5] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-[#176f5b]">Highlight</p>
          <p className="mt-1 text-sm leading-6 text-[#26352d]">
            <HighlightedText query={query} text={highlight} />
          </p>
        </div>
      ) : null}

      {paper.pdfUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <a
            className="rounded-md border border-[#c8d3cc] px-2 py-1 text-[#176f5b] hover:border-[#176f5b]"
            href={paper.pdfUrl}
            rel="noreferrer"
            target="_blank"
          >
            PDF
          </a>
        </div>
      ) : null}
    </article>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function BadgeLink({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className: string;
  href: string;
}) {
  return (
    <a
      className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${className}`}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d9e1dc] bg-[#fbfcfa] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-[#6a756f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1c231f]">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div className="rounded-lg border border-[#d6ddd8] bg-white p-4 shadow-sm" key={item}>
          <div className="h-4 w-40 rounded-md bg-[#e5ece7]" />
          <div className="mt-4 h-5 w-4/5 rounded-md bg-[#dbe5df]" />
          <div className="mt-3 h-4 w-2/3 rounded-md bg-[#e5ece7]" />
          <div className="mt-4 h-16 rounded-md bg-[#f0f4f1]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-[#d6ddd8] bg-white p-6 text-sm text-[#4f5b54]">
      No matching papers found for the selected sources.
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-950">
      {message}
    </div>
  );
}

function HighlightedText({ query, text }: { query: string; text: string }) {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) {
    return text;
  }

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "ig");
  return text.split(pattern).map((part, index) => {
    const highlighted = tokens.some((token) => part.toLowerCase() === token.toLowerCase());
    return highlighted ? (
      <mark className="rounded bg-[#fff3b0] px-0.5 text-inherit" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    );
  });
}

function tokenizeQuery(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2)
    .slice(0, 8);
}

function trimAbstract(value: string, maxLength = 520) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

function getDefaultDateWindow() {
  return getDateWindowForMonths(24);
}

function getDateWindowForMonths(months: number): DateWindow {
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(to);
  from.setUTCMonth(from.getUTCMonth() - months);

  return {
    fromDate: toIsoDate(from),
    toDate: toIsoDate(to),
  };
}

function isValidDateWindow(dateWindow: DateWindow) {
  return (
    isIsoDate(dateWindow.fromDate) &&
    isIsoDate(dateWindow.toDate) &&
    dateWindow.fromDate <= dateWindow.toDate
  );
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value;
}

function parsePageSize(value: string): PageSize {
  const parsed = Number(value);
  return PAGE_SIZE_OPTIONS.includes(parsed as PageSize) ? (parsed as PageSize) : 10;
}

function parseResultLimit(value: string): ResultLimit {
  const parsed = Number(value);
  return RESULT_LIMIT_OPTIONS.includes(parsed as ResultLimit) ? (parsed as ResultLimit) : 100;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getPaperKey(paper: Paper) {
  return `${paper.source}:${paper.id}`;
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
