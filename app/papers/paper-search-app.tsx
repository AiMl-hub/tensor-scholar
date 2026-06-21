"use client";

import { useMemo, useState, type FormEvent } from "react";
import { DEFAULT_VENUE_KEYS, VENUES, type Venue, type VenueArea } from "@/app/lib/venues";
import {
  AppFooter,
  EmptyState,
  ErrorState,
  LoadingState,
  PaperResult,
  ResultsToolbar,
  SearchPanel,
  SourceSidebar,
} from "@/app/papers/components";
import { WINDOW_PRESETS } from "@/app/papers/constants";
import {
  getDateWindowForMonths,
  getDefaultDateWindow,
  isValidDateWindow,
} from "@/app/papers/lib/date";
import { downloadPaperExport } from "@/app/papers/lib/export";
import { getPaperKey } from "@/app/papers/lib/paper";
import type {
  DateWindow,
  DateWindowPreset,
  ExportFormat,
  PageSize,
  Paper,
  ResultLimit,
  SearchField,
  SearchMeta,
  SearchPayload,
  SortMode,
  Status,
} from "@/app/papers/types";

export default function PaperSearchApp() {
  const defaultWindow = useMemo(() => getDefaultDateWindow(), []);
  const [query, setQuery] = useState("");
  const [includeKeywords, setIncludeKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");
  const [field, setField] = useState<SearchField>("all");
  const [sort, setSort] = useState<SortMode>("relevance");
  const [dateWindow, setDateWindow] = useState<DateWindow>(defaultWindow);
  const [windowPreset, setWindowPreset] = useState<DateWindowPreset>("1y");
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
    return VENUES.reduce<Record<VenueArea, Venue[]>>(
      (groups, venue) => {
        groups[venue.area].push(venue);
        return groups;
      },
      { ml: [], cv: [], nlp: [], ai: [], medical: [] },
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

  function clearArea(area: VenueArea) {
    const areaKeys = new Set(groupedVenues[area].map((venue) => venue.key));
    setSelectedVenues((current) => {
      const next = current.filter((key) => !areaKeys.has(key));
      return next.length ? next : current;
    });
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

  function runSampleQuery(sample: string) {
    setQuery(sample);
    void runSearch(sample);
  }

  function clearSelection() {
    setSelectedPaperIds(new Set());
  }

  function exportSelected(format: ExportFormat) {
    if (!selectedPapers.length) {
      return;
    }

    downloadPaperExport(selectedPapers, format);
  }

  const highlightQuery = meta
    ? [meta.query, ...meta.includeKeywords].join(" ")
    : [query, includeKeywords].join(" ");

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#1b1c1a]">
      <SearchPanel
        excludeKeywords={excludeKeywords}
        field={field}
        includeKeywords={includeKeywords}
        maxResults={maxResults}
        onDateWindowChange={applyWindowPreset}
        onExcludeChange={setExcludeKeywords}
        onFieldChange={setField}
        onIncludeChange={setIncludeKeywords}
        onMaxResultsChange={updateMaxResults}
        onQueryChange={setQuery}
        onSampleQuery={runSampleQuery}
        onSubmit={handleSubmit}
        query={query}
        status={status}
        windowPreset={windowPreset}
      />

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <SourceSidebar
          groupedVenues={groupedVenues}
          onClearArea={clearArea}
          onResetVenues={() => setSelectedVenues(DEFAULT_VENUE_KEYS)}
          onSelectArea={selectArea}
          onToggleVenue={toggleVenue}
          selectedVenueSet={selectedVenueSet}
          selectedVenuesCount={selectedVenues.length}
        />

        <section className="min-w-0">
          <ResultsToolbar
            currentPage={safeCurrentPage}
            onClear={clearSelection}
            onExport={exportSelected}
            onPageChange={(page) => setCurrentPage(Math.max(1, Math.min(page, pageCount)))}
            onPageSizeChange={updatePageSize}
            onSelectAll={selectAllVisiblePapers}
            onSortChange={updateSort}
            pageCount={pageCount}
            pageSize={pageSize}
            pageStart={pageStart}
            resultCount={papers.length}
            selectedCount={selectedPapers.length}
            sort={sort}
            status={status}
            visibleCount={visiblePapers.length}
          />

          {meta?.errors.length ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              {meta.errors.join(" ")}
            </div>
          ) : null}

          {status === "loading" ? <LoadingState /> : null}
          {status === "error" ? <ErrorState message={error} /> : null}
          {status === "success" && papers.length === 0 ? <EmptyState /> : null}

          {papers.length > 0 ? (
            <div className="space-y-3">
              {visiblePapers.map((paper) => (
                <PaperResult
                  isSelected={selectedPaperIds.has(getPaperKey(paper))}
                  key={getPaperKey(paper)}
                  onToggleSelection={togglePaperSelection}
                  paper={paper}
                  query={highlightQuery}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <AppFooter />
    </main>
  );
}
