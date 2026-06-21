"use client";

import Image from "next/image";
import { Fragment, type FormEvent, type ReactNode } from "react";
import { AREA_LABELS, VENUES, type Venue, type VenueArea } from "@/app/lib/venues";
import {
  AREA_STYLES,
  EXPORT_OPTIONS,
  FIELD_OPTIONS,
  PAGE_SIZE_OPTIONS,
  RESULT_LIMIT_OPTIONS,
  SAMPLE_QUERIES,
  SORT_OPTIONS,
  WINDOW_PRESETS,
} from "@/app/papers/constants";
import { parsePageSize, parseResultLimit } from "@/app/papers/lib/date";
import type {
  DateWindowPreset,
  ExportFormat,
  PageSize,
  Paper,
  ResultLimit,
  SearchField,
  SortMode,
  Status,
} from "@/app/papers/types";

type SearchPanelProps = {
  excludeKeywords: string;
  field: SearchField;
  includeKeywords: string;
  maxResults: ResultLimit;
  onDateWindowChange: (preset: Exclude<DateWindowPreset, "custom">) => void;
  onExcludeChange: (value: string) => void;
  onFieldChange: (value: SearchField) => void;
  onIncludeChange: (value: string) => void;
  onMaxResultsChange: (value: ResultLimit) => void;
  onQueryChange: (value: string) => void;
  onSampleQuery: (query: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  query: string;
  status: Status;
  windowPreset: DateWindowPreset;
};

type SourceSidebarProps = {
  groupedVenues: Record<VenueArea, Venue[]>;
  onClearArea: (area: VenueArea) => void;
  onResetVenues: () => void;
  onSelectArea: (area: VenueArea) => void;
  onToggleVenue: (key: string) => void;
  selectedVenueSet: Set<string>;
  selectedVenuesCount: number;
};

type ResultsToolbarProps = {
  currentPage: number;
  onClear: () => void;
  onExport: (format: ExportFormat) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
  onSelectAll: () => void;
  onSortChange: (sort: SortMode) => void;
  pageCount: number;
  pageSize: PageSize;
  pageStart: number;
  resultCount: number;
  selectedCount: number;
  sort: SortMode;
  status: Status;
  visibleCount: number;
};

type PaperResultProps = {
  isSelected: boolean;
  onToggleSelection: (paper: Paper) => void;
  paper: Paper;
  query: string;
};

const AREA_RAIL_STYLES: Record<VenueArea, string> = {
  ml: "bg-emerald-300",
  cv: "bg-cyan-300",
  nlp: "bg-rose-300",
  ai: "bg-amber-300",
  medical: "bg-blue-300",
};

export function SearchPanel({
  excludeKeywords,
  field,
  includeKeywords,
  maxResults,
  onDateWindowChange,
  onExcludeChange,
  onFieldChange,
  onIncludeChange,
  onMaxResultsChange,
  onQueryChange,
  onSampleQuery,
  onSubmit,
  query,
  status,
  windowPreset,
}: SearchPanelProps) {
  return (
    <section className="research-hero border-b border-[#b8dcd8]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-[#0f6f7a]">
              A*/A research reef
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Image
                alt=""
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-xl shadow-[4px_4px_0_#ffbd86] sm:h-11 sm:w-11"
                height={40}
                src="/favicon.svg"
                width={40}
              />
              <h1 className="nes-title text-3xl text-[#143840] sm:text-4xl">
                Finding Papers
              </h1>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#47606a]">
              Dive into conference papers and surface the good ones.
            </p>
          </div>
        </div>

        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]" onSubmit={onSubmit}>
          <div className="flex min-h-12 w-full min-w-0 overflow-hidden rounded-xl border-2 border-[#a9d3d0] bg-white shadow-[4px_4px_0_#bfece6] transition focus-within:border-[#0f8e92] focus-within:ring-2 focus-within:ring-[#a8e6de]">
            <label className="sr-only" htmlFor="search-field">
              Search field
            </label>
            <select
              className="min-h-12 w-[120px] shrink-0 border-r border-[#bcd8d5] bg-[#fff4e8] px-3 text-sm font-semibold text-[#17323a] outline-none sm:w-[150px]"
              id="search-field"
              onChange={(event) => onFieldChange(event.target.value as SearchField)}
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
              className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-base outline-none"
              id="paper-query"
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search papers"
              value={query}
            />
          </div>
          <button
            className="h-12 rounded-xl bg-[#c65321] px-6 font-semibold text-white shadow-[4px_4px_0_#9edfd8] transition hover:-translate-y-0.5 hover:bg-[#a8441b] hover:shadow-[5px_5px_0_#9edfd8] focus:outline-none focus:ring-2 focus:ring-[#ffbd86] disabled:cursor-not-allowed disabled:bg-[#9aa9aa]"
            disabled={status === "loading"}
            type="submit"
          >
            {status === "loading" ? "Diving" : "Search"}
          </button>
          <KeywordFilters
            excludeKeywords={excludeKeywords}
            includeKeywords={includeKeywords}
            maxResults={maxResults}
            onDateWindowChange={onDateWindowChange}
            onExcludeChange={onExcludeChange}
            onIncludeChange={onIncludeChange}
            onMaxResultsChange={onMaxResultsChange}
            windowPreset={windowPreset}
          />
        </form>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-[#0f6f7a]">Start with a current</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((sample) => (
              <button
                className="rounded-lg border border-[#b8d7d3] bg-white px-3 py-2 text-sm font-semibold text-[#24434a] shadow-[2px_2px_0_#d5eee9] transition hover:-translate-y-0.5 hover:border-[#c65321] hover:bg-[#fff4e8] hover:text-[#a8441b]"
                key={sample}
                onClick={() => onSampleQuery(sample)}
                type="button"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SourceSidebar({
  groupedVenues,
  onClearArea,
  onResetVenues,
  onSelectArea,
  onToggleVenue,
  selectedVenueSet,
  selectedVenuesCount,
}: SourceSidebarProps) {
  return (
    <aside className="h-fit rounded-xl border border-[#cfe3df] bg-[#fbfefd] p-4 shadow-[0_10px_28px_rgba(15,111,122,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase text-[#31515a]">Sources</h2>
          <p className="mt-1 rounded-full bg-[#e9f8f6] px-2 py-1 text-xs font-semibold text-[#5b7076]">
            {selectedVenuesCount}/{VENUES.length} venues
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-[#bdd9d5] bg-white px-2 py-1 text-xs font-semibold text-[#32515a] shadow-[2px_2px_0_#e5f5f2] transition hover:-translate-y-0.5 hover:border-[#0f6f7a] hover:text-[#0f6f7a]"
            onClick={onResetVenues}
            type="button"
          >
            All
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-5">
        {(Object.keys(groupedVenues) as VenueArea[]).map((area) => {
          const areaVenues = groupedVenues[area];
          const areaSelectedCount = areaVenues.filter((venue) =>
            selectedVenueSet.has(venue.key),
          ).length;
          const allAreaSelected = areaSelectedCount === areaVenues.length;
          const canClearArea = areaSelectedCount > 0 && areaSelectedCount < selectedVenuesCount;

          return (
            <section className="rounded-lg border border-[#e5f2ef] bg-white/70 p-2" key={area}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#17323a]">{AREA_LABELS[area]}</h3>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md px-1.5 py-1 text-xs font-semibold text-[#0f6f7a] hover:bg-[#e9f8f6] hover:text-[#0b5159] disabled:cursor-not-allowed disabled:text-[#9aa69f]"
                    disabled={allAreaSelected}
                    onClick={() => onSelectArea(area)}
                    type="button"
                  >
                    Select
                  </button>
                  <button
                    className="rounded-md px-1.5 py-1 text-xs font-semibold text-[#0f6f7a] hover:bg-[#fff2e7] hover:text-[#7a4122] disabled:cursor-not-allowed disabled:text-[#9aa69f]"
                    disabled={!canClearArea}
                    onClick={() => onClearArea(area)}
                    title={canClearArea ? undefined : "Keep at least one venue selected"}
                    type="button"
                  >
                    Unselect
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {areaVenues.map((venue) => {
                  const active = selectedVenueSet.has(venue.key);
                  return (
                    <button
                      aria-pressed={active}
                      className={[
                        "rounded-md border px-2.5 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5",
                        active
                          ? `${AREA_STYLES[venue.area]} shadow-[2px_2px_0_rgba(15,111,122,0.18)]`
                          : "border-[#cce0dc] bg-[#fbfefd] text-[#65777c] hover:border-[#0f6f7a]",
                      ].join(" ")}
                      key={venue.key}
                      onClick={() => onToggleVenue(venue.key)}
                      title={`${venue.fullName} (${venue.rank})`}
                      type="button"
                    >
                      {venue.label}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

export function ResultsToolbar({
  currentPage,
  onClear,
  onExport,
  onPageChange,
  onPageSizeChange,
  onSelectAll,
  onSortChange,
  pageCount,
  pageSize,
  pageStart,
  resultCount,
  selectedCount,
  sort,
  status,
  visibleCount,
}: ResultsToolbarProps) {
  const hasResults = resultCount > 0;
  const hasSelection = selectedCount > 0;
  const firstVisible = hasResults ? pageStart + 1 : 0;
  const lastVisible = Math.min(pageStart + visibleCount, resultCount);
  const statusText =
    status === "success"
      ? `${resultCount} papers`
      : status === "loading"
        ? "Diving through papers"
        : "Ready to dive";

  return (
    <div className="mb-4 rounded-xl border border-[#cfe3df] bg-[#fbfefd] shadow-[0_10px_28px_rgba(15,111,122,0.08)]">
      <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-semibold text-[#17323a]">{statusText}</p>
        <SegmentedControl<SortMode>
          label="Sort"
          onChange={onSortChange}
          options={SORT_OPTIONS}
          stackUntilLarge
          value={sort}
        />
      </div>

      {hasResults ? (
        <div className="border-t border-[#dbecea] px-3 py-2.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
              <span className="text-[#17323a]">
                Showing {firstVisible}-{lastVisible} of {resultCount}
              </span>
              {hasSelection ? <span className="text-[#5b7076]">{selectedCount} selected</span> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#31515a]" htmlFor="page-size">
                Per page
                <select
                  className="h-10 rounded-md border border-[#bcd8d5] bg-white px-3 text-sm font-semibold text-[#17323a] outline-none transition focus:border-[#0f8e92] focus:ring-2 focus:ring-[#a8e6de]"
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

              <div className="grid grid-cols-[auto_1fr_auto] items-center overflow-hidden rounded-md border border-[#bcd8d5] bg-white">
                <button
                  className="min-h-10 px-3 text-sm font-semibold text-[#0f6f7a] transition hover:bg-[#e9f8f6] disabled:cursor-not-allowed disabled:text-[#9aa69f]"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                  type="button"
                >
                  Prev
                </button>
                <span className="border-x border-[#bcd8d5] px-3 text-center text-sm font-semibold text-[#31515a]">
                  {currentPage}/{pageCount}
                </span>
                <button
                  className="min-h-10 px-3 text-sm font-semibold text-[#0f6f7a] transition hover:bg-[#e9f8f6] disabled:cursor-not-allowed disabled:text-[#9aa69f]"
                  disabled={currentPage >= pageCount}
                  onClick={() => onPageChange(currentPage + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>

              <button
                aria-label={`Select all ${visibleCount} papers on this page`}
                className="min-h-10 rounded-md border border-[#bcd8d5] px-3 text-sm font-semibold text-[#0f6f7a] transition hover:border-[#0f6f7a]"
                onClick={onSelectAll}
                type="button"
              >
                Select {visibleCount}
              </button>
              {hasSelection ? (
                <>
                  <button
                    className="min-h-10 rounded-md border border-[#bcd8d5] px-3 text-sm font-semibold text-[#5d6962] transition hover:border-[#0f6f7a] hover:text-[#0f6f7a]"
                    onClick={onClear}
                    type="button"
                  >
                    Clear
                  </button>
                  <details className="group relative">
                    <summary
                      aria-label="Export selected papers"
                      className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md bg-[#0f6f7a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b5159] focus:outline-none focus:ring-2 focus:ring-[#a8e6de] [&::-webkit-details-marker]:hidden"
                    >
                      Export
                      <span aria-hidden="true" className="text-xs transition group-open:rotate-180">
                        v
                      </span>
                    </summary>
                    <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-md border border-[#bcd8d5] bg-white shadow-lg">
                      {EXPORT_OPTIONS.map((option) => (
                        <button
                          className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#17323a] transition hover:bg-[#e9f8f6] hover:text-[#0f6f7a]"
                          key={option.value}
                          onClick={(event) => {
                            onExport(option.value);
                            event.currentTarget.closest("details")?.removeAttribute("open");
                          }}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </details>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PaperResult({ isSelected, onToggleSelection, paper, query }: PaperResultProps) {
  const authors = paper.authors.slice(0, 8).join(", ");
  const extraAuthors = Math.max(0, paper.authors.length - 8);
  const highlight = paper.highlight ? trimAbstract(paper.highlight, 420) : null;

  return (
    <article
      className={[
        "relative overflow-hidden rounded-xl border bg-[#fffdf8] p-4 pl-5 shadow-[0_8px_24px_rgba(15,111,122,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,111,122,0.1)]",
        isSelected ? "border-[#0f6f7a] ring-2 ring-[#a8e6de]" : "border-[#cfe3df]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={["absolute left-0 top-0 h-full w-1.5", AREA_RAIL_STYLES[paper.area]].join(" ")}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex w-fit items-center gap-2 rounded-md border border-[#bcd8d5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#17323a] shadow-[2px_2px_0_#e5f5f2]">
              <input
                checked={isSelected}
                className="h-4 w-4 accent-[#0f6f7a]"
                onChange={() => onToggleSelection(paper)}
                type="checkbox"
              />
              Select
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge className={AREA_STYLES[paper.area]}>{paper.venueLabel}</Badge>
              <Badge
                className={
                  paper.rank === "A*"
                    ? "border-[#f2c35b] bg-[#fff3c4] text-[#6a4a00]"
                    : "border-[#c9d4cc] bg-[#f4f7f2] text-[#435047]"
                }
              >
                {paper.rank}
              </Badge>
              {paper.year ? (
                <Badge className="border-[#c9d4cc] bg-[#f4f7f2] text-[#435047]">
                  {String(paper.year)}
                </Badge>
              ) : null}
            </div>
          </div>

          <h2 className="text-lg font-semibold leading-snug text-[#112f36]">
            {paper.url ? (
              <a className="hover:text-[#0f6f7a]" href={paper.url} rel="noreferrer" target="_blank">
                <HighlightedText query={query} text={paper.title} />
              </a>
            ) : (
              <HighlightedText query={query} text={paper.title} />
            )}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#526a70]">
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
        <div className="mt-3 rounded-lg border border-[#b9ddd8] bg-[#f0fbfa] px-3 py-2 shadow-[inset_3px_0_0_#ffb270]">
          <p className="text-[10px] font-semibold uppercase text-[#0f6f7a]">Highlight</p>
          <p className="mt-1 text-sm leading-6 text-[#18343b]">
            <HighlightedText query={query} text={highlight} />
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div className="rounded-xl border border-[#cfe3df] bg-[#fffdf8] p-4 shadow-sm" key={item}>
          <div className="h-4 w-40 rounded-md bg-[#ffe0bf]" />
          <div className="mt-4 h-5 w-4/5 rounded-md bg-[#d4f1ed]" />
          <div className="mt-3 h-4 w-2/3 rounded-md bg-[#e5f5f2]" />
          <div className="mt-4 h-16 rounded-md bg-[#fff2e2]" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-xl border border-[#cfe3df] bg-[#fbfefd] p-6 text-sm text-[#526a70] shadow-[0_10px_28px_rgba(15,111,122,0.08)]">
      No papers surfaced yet for this trail. Try a wider source mix or a softer keyword.
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-950 shadow-[0_10px_28px_rgba(120,30,55,0.08)]">
      The current got choppy. {message}
    </div>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-[#b8dcd8] bg-[#e8f8f6]">
      <div className="nes-title mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-[#143840] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Copyright 2026 Mai A. Shaaban</p>
        <div className="flex flex-wrap gap-3">
          <a
            className="text-[#0f6f7a] hover:text-[#0b5159]"
            href="https://www.linkedin.com/in/maiahmed"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
          <a
            className="text-[#0f6f7a] hover:text-[#0b5159]"
            href="https://mai-cs.github.io"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

function KeywordFilters({
  excludeKeywords,
  includeKeywords,
  maxResults,
  onDateWindowChange,
  onExcludeChange,
  onIncludeChange,
  onMaxResultsChange,
  windowPreset,
}: {
  excludeKeywords: string;
  includeKeywords: string;
  maxResults: ResultLimit;
  onDateWindowChange: (preset: Exclude<DateWindowPreset, "custom">) => void;
  onExcludeChange: (value: string) => void;
  onIncludeChange: (value: string) => void;
  onMaxResultsChange: (value: ResultLimit) => void;
  windowPreset: DateWindowPreset;
}) {
  return (
    <div className="grid gap-3 lg:col-span-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_150px]">
      <label className="grid gap-1 text-xs font-semibold uppercase text-[#5b7076]" htmlFor="include-keywords">
        Must include
        <input
          className="h-11 rounded-xl border border-[#b8d7d3] bg-white px-3 text-sm font-medium text-[#17323a] shadow-[2px_2px_0_#d7eee9] outline-none transition focus:border-[#0f8e92] focus:ring-2 focus:ring-[#a8e6de]"
          id="include-keywords"
          onChange={(event) => onIncludeChange(event.target.value)}
          placeholder="agentic, benchmark"
          type="text"
          value={includeKeywords}
        />
      </label>

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#5b7076]" htmlFor="exclude-keywords">
        Exclude
        <input
          className="h-11 rounded-xl border border-[#b8d7d3] bg-white px-3 text-sm font-medium text-[#17323a] shadow-[2px_2px_0_#ffe0d1] outline-none transition focus:border-[#c65321] focus:ring-2 focus:ring-[#ffc4a3]"
          id="exclude-keywords"
          onChange={(event) => onExcludeChange(event.target.value)}
          placeholder="survey, tutorial"
          type="text"
          value={excludeKeywords}
        />
      </label>

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#5b7076]" htmlFor="date-window">
        Date window
        <select
          className="h-11 rounded-xl border border-[#b8d7d3] bg-white px-3 text-sm font-semibold text-[#17323a] shadow-[2px_2px_0_#d7eee9] outline-none transition focus:border-[#0f8e92] focus:ring-2 focus:ring-[#a8e6de]"
          id="date-window"
          onChange={(event) => onDateWindowChange(event.target.value as Exclude<DateWindowPreset, "custom">)}
          value={windowPreset === "custom" ? "1y" : windowPreset}
        >
          {WINDOW_PRESETS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#5b7076]" htmlFor="max-results">
        Max results
        <select
          className="h-11 rounded-xl border border-[#b8d7d3] bg-white px-3 text-sm font-semibold text-[#17323a] shadow-[2px_2px_0_#d7eee9] outline-none transition focus:border-[#0f8e92] focus:ring-2 focus:ring-[#a8e6de]"
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
      className={`flex w-full max-w-full overflow-hidden rounded-xl border border-[#bcd8d5] bg-white shadow-[2px_2px_0_#e5f5f2] ${controlWidthClass}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            className={[
              "min-h-10 min-w-0 flex-1 truncate whitespace-nowrap px-2.5 text-sm font-semibold transition sm:px-3",
              buttonWidthClass,
              active ? "bg-[#0f6f7a] text-white" : "text-[#31515a] hover:bg-[#fff0de]",
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

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#b9ddd8] bg-white px-3 py-2 shadow-[2px_2px_0_#e5f5f2]">
      <p className="text-[10px] font-semibold uppercase text-[#61777c]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#17323a]">{value}</p>
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
      <mark className="rounded bg-[#fff1a6] px-0.5 text-inherit" key={`${part}-${index}`}>
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
