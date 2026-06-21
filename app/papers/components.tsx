"use client";

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
    <section className="research-hero border-b border-[#e6e0ee]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-[#7f6541]">
              A*/A conference search
            </p>
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- Tiny SVG logo; next/image triggers vinext dev HMR issues here. */}
              <img
                alt=""
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-md shadow-[4px_4px_0_#e6dcff] sm:h-11 sm:w-11"
                src="/favicon.svg"
              />
              <h1 className="nes-title text-3xl text-[#241b31] sm:text-4xl">
                Tensor Scholar
              </h1>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#5d5866]">
              Find the papers that make your next idea click.
            </p>
          </div>
        </div>

        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]" onSubmit={onSubmit}>
          <div className="flex min-h-12 w-full min-w-0 overflow-hidden rounded-xl border-2 border-[#ded7eb] bg-white shadow-[4px_4px_0_#f0edf6] transition focus-within:border-[#6d4bc3] focus-within:ring-2 focus-within:ring-[#d8ccff]">
            <label className="sr-only" htmlFor="search-field">
              Search field
            </label>
            <select
              className="min-h-12 w-[120px] shrink-0 border-r border-[#e2dced] bg-[linear-gradient(135deg,#fbf9ff_0%,#ffffff_62%,#f7fcf8_100%)] px-3 text-sm font-semibold text-[#2d2538] outline-none sm:w-[150px]"
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
            className="h-12 rounded-xl bg-[linear-gradient(135deg,#6d4bc3_0%,#7b65cf_52%,#2f8f73_100%)] px-6 font-semibold text-white shadow-[4px_4px_0_#e6dcff] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#55359b_0%,#6d4bc3_50%,#24735d_100%)] hover:shadow-[5px_5px_0_#e6dcff] focus:outline-none focus:ring-2 focus:ring-[#d8ccff] disabled:cursor-not-allowed disabled:bg-[#b6aec9]"
            disabled={status === "loading"}
            type="submit"
          >
            {status === "loading" ? "Searching" : "Search"}
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
          <p className="mb-2 text-xs font-semibold uppercase text-[#7f6541]">Start with a spark</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((sample) => (
              <button
                className="rounded-lg border border-[#ded7eb] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_72%,#f8fcf9_100%)] px-3 py-2 text-sm font-semibold text-[#44384f] shadow-[2px_2px_0_#f1edf7] transition hover:-translate-y-0.5 hover:border-[#9d89d8] hover:bg-[linear-gradient(135deg,#fbf9ff_0%,#ffffff_58%,#f5fbf7_100%)] hover:text-[#6d4bc3]"
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
    <aside className="h-fit rounded-xl border border-[#e3dcec] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_76%,#f8fcf9_100%)] p-4 shadow-[0_10px_28px_rgba(65,47,100,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase text-[#50475d]">Sources</h2>
          <p className="mt-1 rounded-full bg-[linear-gradient(135deg,#fbf9ff_0%,#ffffff_58%,#f5fbf7_100%)] px-2 py-1 text-xs font-semibold text-[#665d70]">
            {selectedVenuesCount}/{VENUES.length} venues
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-[#ded7eb] bg-white px-2 py-1 text-xs font-semibold text-[#51465f] shadow-[2px_2px_0_#f4f1f8] transition hover:-translate-y-0.5 hover:border-[#8f7ed0] hover:text-[#6d4bc3]"
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
            <section className="rounded-lg border border-[#f0ecf6] bg-white/75 p-2" key={area}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#2d2538]">{AREA_LABELS[area]}</h3>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md px-1.5 py-1 text-xs font-semibold text-[#6d4bc3] hover:bg-[#fbf9ff] hover:text-[#4d2e8f] disabled:cursor-not-allowed disabled:text-[#9f98aa]"
                    disabled={allAreaSelected}
                    onClick={() => onSelectArea(area)}
                    type="button"
                  >
                    Select
                  </button>
                  <button
                    className="rounded-md px-1.5 py-1 text-xs font-semibold text-[#6d4bc3] hover:bg-[#fff2e7] hover:text-[#7a4122] disabled:cursor-not-allowed disabled:text-[#9f98aa]"
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
                          ? `${AREA_STYLES[venue.area]} shadow-[2px_2px_0_rgba(109,75,195,0.12)]`
                          : "border-[#e3dcec] bg-[#fffefd] text-[#6b6075] hover:border-[#8f7ed0]",
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
        ? "Searching"
        : "Ready for a paper trail";

  return (
    <div className="mb-4 rounded-xl border border-[#e3dcec] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_78%,#f8fcf9_100%)] shadow-[0_10px_28px_rgba(65,47,100,0.06)]">
      <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-semibold text-[#2d2538]">{statusText}</p>
        <SegmentedControl<SortMode>
          label="Sort"
          onChange={onSortChange}
          options={SORT_OPTIONS}
          stackUntilLarge
          value={sort}
        />
      </div>

      {hasResults ? (
        <div className="border-t border-[#f0ecf6] px-3 py-2.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
              <span className="text-[#2d2538]">
                Showing {firstVisible}-{lastVisible} of {resultCount}
              </span>
              {hasSelection ? <span className="text-[#655a73]">{selectedCount} selected</span> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#51465f]" htmlFor="page-size">
                Per page
                <select
                  className="h-10 rounded-md border border-[#ded7eb] bg-white px-3 text-sm font-semibold text-[#2d2538] outline-none transition focus:border-[#6d4bc3] focus:ring-2 focus:ring-[#d8ccff]"
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

              <div className="grid grid-cols-[auto_1fr_auto] items-center overflow-hidden rounded-md border border-[#ded7eb] bg-white">
                <button
                  className="min-h-10 px-3 text-sm font-semibold text-[#6d4bc3] transition hover:bg-[#f7fbf8] disabled:cursor-not-allowed disabled:text-[#9f98aa]"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                  type="button"
                >
                  Prev
                </button>
                <span className="border-x border-[#ded7eb] px-3 text-center text-sm font-semibold text-[#51465f]">
                  {currentPage}/{pageCount}
                </span>
                <button
                  className="min-h-10 px-3 text-sm font-semibold text-[#6d4bc3] transition hover:bg-[#f7fbf8] disabled:cursor-not-allowed disabled:text-[#9f98aa]"
                  disabled={currentPage >= pageCount}
                  onClick={() => onPageChange(currentPage + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>

              <button
                aria-label={`Select all ${visibleCount} papers on this page`}
                  className="min-h-10 rounded-md border border-[#ded7eb] px-3 text-sm font-semibold text-[#6d4bc3] transition hover:border-[#8f7ed0] hover:bg-[#fbf9ff]"
                onClick={onSelectAll}
                type="button"
              >
                Select {visibleCount}
              </button>
              {hasSelection ? (
                <>
                  <button
                    className="min-h-10 rounded-md border border-[#ded7eb] px-3 text-sm font-semibold text-[#62556f] transition hover:border-[#8f7ed0] hover:text-[#6d4bc3]"
                    onClick={onClear}
                    type="button"
                  >
                    Clear
                  </button>
                  <details className="group relative">
                    <summary
                      aria-label="Export selected papers"
                      className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md bg-[linear-gradient(135deg,#6d4bc3_0%,#7b65cf_52%,#2f8f73_100%)] px-4 text-sm font-semibold text-white transition hover:bg-[linear-gradient(135deg,#55359b_0%,#6d4bc3_50%,#24735d_100%)] focus:outline-none focus:ring-2 focus:ring-[#d8ccff] [&::-webkit-details-marker]:hidden"
                    >
                      Export
                      <span aria-hidden="true" className="text-xs transition group-open:rotate-180">
                        v
                      </span>
                    </summary>
                    <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-md border border-[#ded7eb] bg-white shadow-lg">
                      {EXPORT_OPTIONS.map((option) => (
                        <button
                          className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#2d2538] transition hover:bg-[#f7fbf8] hover:text-[#6d4bc3]"
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
        "relative overflow-hidden rounded-xl border bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_78%,#f8fcf9_100%)] p-4 pl-5 shadow-[0_8px_24px_rgba(65,47,100,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(65,47,100,0.1)]",
        isSelected ? "border-[#6d4bc3] ring-2 ring-[#d8ccff]" : "border-[#e3dcec]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={["absolute left-0 top-0 h-full w-1.5", AREA_RAIL_STYLES[paper.area]].join(" ")}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex w-fit items-center gap-2 rounded-md border border-[#ded7eb] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2d2538] shadow-[2px_2px_0_#f4f1f8]">
              <input
                checked={isSelected}
                className="h-4 w-4 accent-[#6d4bc3]"
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
                    : "border-[#ded7eb] bg-[linear-gradient(135deg,#ffffff_0%,#fbf9ff_68%,#f7fbf8_100%)] text-[#51465f]"
                }
              >
                {paper.rank}
              </Badge>
              {paper.year ? (
                <Badge className="border-[#ded7eb] bg-[linear-gradient(135deg,#ffffff_0%,#fbf9ff_68%,#f7fbf8_100%)] text-[#51465f]">
                  {String(paper.year)}
                </Badge>
              ) : null}
            </div>
          </div>

          <h2 className="text-lg font-semibold leading-snug text-[#211b2b]">
            {paper.url ? (
              <a className="hover:text-[#6d4bc3]" href={paper.url} rel="noreferrer" target="_blank">
                <HighlightedText query={query} text={paper.title} />
              </a>
            ) : (
              <HighlightedText query={query} text={paper.title} />
            )}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#5f5669]">
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
        <div className="mt-3 rounded-lg border border-[#ded7eb] bg-[linear-gradient(135deg,#ffffff_0%,#fbf8ff_58%,#f7fcf8_100%)] px-3 py-2 shadow-[inset_3px_0_0_#b8eadc]">
          <p className="text-[10px] font-semibold uppercase text-[#6d4bc3]">Highlight</p>
          <p className="mt-1 text-sm leading-6 text-[#2f2939]">
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
        <div className="rounded-xl border border-[#e3dcec] bg-white p-4 shadow-sm" key={item}>
          <div className="h-4 w-40 rounded-md bg-[#f6e8bf]" />
          <div className="mt-4 h-5 w-4/5 rounded-md bg-[#ebe5ff]" />
          <div className="mt-3 h-4 w-2/3 rounded-md bg-[#e8f7f0]" />
          <div className="mt-4 h-16 rounded-md bg-[#f7f2df]" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-xl border border-[#e3dcec] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_76%,#f8fcf9_100%)] p-6 text-sm text-[#5f5669] shadow-[0_10px_28px_rgba(65,47,100,0.06)]">
      No papers surfaced yet for this trail. Try a wider source mix or a softer keyword.
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-950 shadow-[0_10px_28px_rgba(120,30,55,0.08)]">
      Search took a rough turn. {message}
    </div>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-[#e6e0ee] bg-[linear-gradient(120deg,#fbf9ff_0%,#ffffff_48%,#f8fcf9_100%)]">
      <div className="nes-title mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-[#241c2d] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Copyright 2026 Mai A. Shaaban</p>
        <div className="flex flex-wrap gap-3">
          <a
            className="text-[#6d4bc3] hover:text-[#4d2e8f]"
            href="https://www.linkedin.com/in/maiahmed"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
          <a
            className="text-[#6d4bc3] hover:text-[#4d2e8f]"
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
      <label className="grid gap-1 text-xs font-semibold uppercase text-[#655a73]" htmlFor="include-keywords">
        Must include
        <input
          className="h-11 rounded-xl border border-[#ded7eb] bg-white px-3 text-sm font-medium text-[#2d2538] shadow-[2px_2px_0_#f1edf7] outline-none transition focus:border-[#6d4bc3] focus:ring-2 focus:ring-[#d8ccff]"
          id="include-keywords"
          onChange={(event) => onIncludeChange(event.target.value)}
          placeholder="agentic, benchmark"
          type="text"
          value={includeKeywords}
        />
      </label>

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#655a73]" htmlFor="exclude-keywords">
        Exclude
        <input
          className="h-11 rounded-xl border border-[#ded7eb] bg-white px-3 text-sm font-medium text-[#2d2538] shadow-[2px_2px_0_#f2dfe8] outline-none transition focus:border-[#b15b65] focus:ring-2 focus:ring-[#f2b6bd]"
          id="exclude-keywords"
          onChange={(event) => onExcludeChange(event.target.value)}
          placeholder="survey, tutorial"
          type="text"
          value={excludeKeywords}
        />
      </label>

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#655a73]" htmlFor="date-window">
        Date window
        <select
          className="h-11 rounded-xl border border-[#ded7eb] bg-white px-3 text-sm font-semibold text-[#2d2538] shadow-[2px_2px_0_#f1edf7] outline-none transition focus:border-[#6d4bc3] focus:ring-2 focus:ring-[#d8ccff]"
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

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#655a73]" htmlFor="max-results">
        Max results
        <select
          className="h-11 rounded-xl border border-[#ded7eb] bg-white px-3 text-sm font-semibold text-[#2d2538] shadow-[2px_2px_0_#f1edf7] outline-none transition focus:border-[#6d4bc3] focus:ring-2 focus:ring-[#d8ccff]"
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
      className={`flex w-full max-w-full overflow-hidden rounded-xl border border-[#ded7eb] bg-white shadow-[2px_2px_0_#f4f1f8] ${controlWidthClass}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            className={[
              "min-h-10 min-w-0 flex-1 truncate whitespace-nowrap px-2.5 text-sm font-semibold transition sm:px-3",
              buttonWidthClass,
              active
                ? "bg-[linear-gradient(135deg,#6d4bc3_0%,#7b65cf_52%,#2f8f73_100%)] text-white"
                : "text-[#51465f] hover:bg-[#f7fbf8]",
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
    <div className="rounded-lg border border-[#e3dcec] bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_72%,#f8fcf9_100%)] px-3 py-2 shadow-[2px_2px_0_#f4f1f8]">
      <p className="text-[10px] font-semibold uppercase text-[#71667e]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#241c2d]">{value}</p>
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
