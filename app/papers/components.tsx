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
    <section className="research-hero border-b border-[#cdd8cf]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-[#7f6541]">
              search Top AI conferences
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Image
                alt=""
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-md shadow-[4px_4px_0_#b8eadc] sm:h-11 sm:w-11"
                height={40}
                src="/favicon.svg"
                width={40}
              />
              <h1 className="nes-title text-3xl text-[#15251d] sm:text-4xl">
                Tensor Scholar
              </h1>
            </div>
          </div>
        </div>

        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]" onSubmit={onSubmit}>
          <div className="flex min-h-12 w-full min-w-0 overflow-hidden rounded-xl border-2 border-[#aebfb3] bg-white shadow-[4px_4px_0_#ccecdf] transition focus-within:border-[#1d8a6c] focus-within:ring-2 focus-within:ring-[#93d7c0]">
            <label className="sr-only" htmlFor="search-field">
              Search field
            </label>
            <select
              className="min-h-12 w-[120px] shrink-0 border-r border-[#c8d3cc] bg-[#fff9e8] px-3 text-sm font-semibold text-[#25302a] outline-none sm:w-[150px]"
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
            className="h-12 rounded-xl bg-[#176f5b] px-6 font-semibold text-white shadow-[4px_4px_0_#bfded1] transition hover:-translate-y-0.5 hover:bg-[#115744] hover:shadow-[5px_5px_0_#bfded1] focus:outline-none focus:ring-2 focus:ring-[#93d7c0] disabled:cursor-not-allowed disabled:bg-[#8aa39a]"
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
                className="rounded-lg border border-[#b8c7be] bg-white px-3 py-2 text-sm font-semibold text-[#344139] shadow-[2px_2px_0_#d9e4dd] transition hover:-translate-y-0.5 hover:border-[#176f5b] hover:bg-[#eef8f2] hover:text-[#176f5b]"
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
    <aside className="h-fit rounded-xl border border-[#d8dccd] bg-[#fbfdf9] p-4 shadow-[0_10px_28px_rgba(34,60,47,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase text-[#46534a]">Sources</h2>
          <p className="mt-1 rounded-full bg-[#eef8f2] px-2 py-1 text-xs font-semibold text-[#65716a]">
            {selectedVenuesCount}/{VENUES.length} venues
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-[#cbd6d0] bg-white px-2 py-1 text-xs font-semibold text-[#47534c] shadow-[2px_2px_0_#edf3ef] transition hover:-translate-y-0.5 hover:border-[#176f5b] hover:text-[#176f5b]"
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
            <section className="rounded-lg border border-[#edf1e8] bg-white/70 p-2" key={area}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#25302a]">{AREA_LABELS[area]}</h3>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md px-1.5 py-1 text-xs font-semibold text-[#176f5b] hover:bg-[#eef8f2] hover:text-[#0f4c3d] disabled:cursor-not-allowed disabled:text-[#9aa69f]"
                    disabled={allAreaSelected}
                    onClick={() => onSelectArea(area)}
                    type="button"
                  >
                    Select
                  </button>
                  <button
                    className="rounded-md px-1.5 py-1 text-xs font-semibold text-[#176f5b] hover:bg-[#fff2e7] hover:text-[#7a4122] disabled:cursor-not-allowed disabled:text-[#9aa69f]"
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
                          ? `${AREA_STYLES[venue.area]} shadow-[2px_2px_0_rgba(23,111,91,0.16)]`
                          : "border-[#d6ddd8] bg-[#fafbf8] text-[#626d66] hover:border-[#176f5b]",
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
    <div className="mb-4 rounded-xl border border-[#d8dccd] bg-[#fbfdf9] shadow-[0_10px_28px_rgba(34,60,47,0.08)]">
      <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-semibold text-[#25302a]">{statusText}</p>
        <SegmentedControl<SortMode>
          label="Sort"
          onChange={onSortChange}
          options={SORT_OPTIONS}
          stackUntilLarge
          value={sort}
        />
      </div>

      {hasResults ? (
        <div className="border-t border-[#e8eadc] px-3 py-2.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
              <span className="text-[#25302a]">
                Showing {firstVisible}-{lastVisible} of {resultCount}
              </span>
              {hasSelection ? <span className="text-[#65716a]">{selectedCount} selected</span> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
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

              <div className="grid grid-cols-[auto_1fr_auto] items-center overflow-hidden rounded-md border border-[#c8d3cc] bg-white">
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

              <button
                aria-label={`Select all ${visibleCount} papers on this page`}
                  className="min-h-10 rounded-md border border-[#c8d3cc] px-3 text-sm font-semibold text-[#176f5b] transition hover:border-[#176f5b]"
                onClick={onSelectAll}
                type="button"
              >
                Select {visibleCount}
              </button>
              {hasSelection ? (
                <>
                  <button
                    className="min-h-10 rounded-md border border-[#c8d3cc] px-3 text-sm font-semibold text-[#5d6962] transition hover:border-[#176f5b] hover:text-[#176f5b]"
                    onClick={onClear}
                    type="button"
                  >
                    Clear
                  </button>
                  <details className="group relative">
                    <summary
                      aria-label="Export selected papers"
                      className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md bg-[#176f5b] px-4 text-sm font-semibold text-white transition hover:bg-[#115744] focus:outline-none focus:ring-2 focus:ring-[#93d7c0] [&::-webkit-details-marker]:hidden"
                    >
                      Export
                      <span aria-hidden="true" className="text-xs transition group-open:rotate-180">
                        v
                      </span>
                    </summary>
                    <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-md border border-[#c8d3cc] bg-white shadow-lg">
                      {EXPORT_OPTIONS.map((option) => (
                        <button
                          className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#25302a] transition hover:bg-[#eef5f0] hover:text-[#176f5b]"
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
        "relative overflow-hidden rounded-xl border bg-[#fffef9] p-4 pl-5 shadow-[0_8px_24px_rgba(34,60,47,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(34,60,47,0.1)]",
        isSelected ? "border-[#176f5b] ring-2 ring-[#93d7c0]" : "border-[#d8dccd]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={["absolute left-0 top-0 h-full w-1.5", AREA_RAIL_STYLES[paper.area]].join(" ")}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex w-fit items-center gap-2 rounded-md border border-[#c8d3cc] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#25302a] shadow-[2px_2px_0_#edf3ef]">
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
        <div className="mt-3 rounded-lg border border-[#c7ded3] bg-[#f4fbf5] px-3 py-2 shadow-[inset_3px_0_0_#9edfd0]">
          <p className="text-[10px] font-semibold uppercase text-[#176f5b]">Highlight</p>
          <p className="mt-1 text-sm leading-6 text-[#26352d]">
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
        <div className="rounded-xl border border-[#d8dccd] bg-[#fffef9] p-4 shadow-sm" key={item}>
          <div className="h-4 w-40 rounded-md bg-[#f6e8bf]" />
          <div className="mt-4 h-5 w-4/5 rounded-md bg-[#d7ece2]" />
          <div className="mt-3 h-4 w-2/3 rounded-md bg-[#e8f1ed]" />
          <div className="mt-4 h-16 rounded-md bg-[#f7f2df]" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-xl border border-[#d8dccd] bg-[#fbfdf9] p-6 text-sm text-[#4f5b54] shadow-[0_10px_28px_rgba(34,60,47,0.08)]">
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
    <footer className="border-t border-[#cdd8cf] bg-[#eef5ef]">
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
      <label className="grid gap-1 text-xs font-semibold uppercase text-[#65716a]" htmlFor="include-keywords">
        Must include
        <input
          className="h-11 rounded-xl border border-[#b8c7be] bg-white px-3 text-sm font-medium text-[#25302a] shadow-[2px_2px_0_#e3efe8] outline-none transition focus:border-[#1d8a6c] focus:ring-2 focus:ring-[#93d7c0]"
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
          className="h-11 rounded-xl border border-[#b8c7be] bg-white px-3 text-sm font-medium text-[#25302a] shadow-[2px_2px_0_#f8dfdf] outline-none transition focus:border-[#b15b65] focus:ring-2 focus:ring-[#f2b6bd]"
          id="exclude-keywords"
          onChange={(event) => onExcludeChange(event.target.value)}
          placeholder="survey, tutorial"
          type="text"
          value={excludeKeywords}
        />
      </label>

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#65716a]" htmlFor="date-window">
        Date window
        <select
          className="h-11 rounded-xl border border-[#b8c7be] bg-white px-3 text-sm font-semibold text-[#25302a] shadow-[2px_2px_0_#e3efe8] outline-none transition focus:border-[#1d8a6c] focus:ring-2 focus:ring-[#93d7c0]"
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

      <label className="grid gap-1 text-xs font-semibold uppercase text-[#65716a]" htmlFor="max-results">
        Max results
        <select
          className="h-11 rounded-xl border border-[#b8c7be] bg-white px-3 text-sm font-semibold text-[#25302a] shadow-[2px_2px_0_#e3efe8] outline-none transition focus:border-[#1d8a6c] focus:ring-2 focus:ring-[#93d7c0]"
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
      className={`flex w-full max-w-full overflow-hidden rounded-xl border border-[#c8d3cc] bg-white shadow-[2px_2px_0_#edf3ef] ${controlWidthClass}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            className={[
              "min-h-10 min-w-0 flex-1 truncate whitespace-nowrap px-2.5 text-sm font-semibold transition sm:px-3",
              buttonWidthClass,
              active ? "bg-[#1d6f5c] text-white" : "text-[#405047] hover:bg-[#fff6db]",
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
    <div className="rounded-lg border border-[#d9e1dc] bg-white px-3 py-2 shadow-[2px_2px_0_#edf3ef]">
      <p className="text-[10px] font-semibold uppercase text-[#6a756f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1c231f]">{value}</p>
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
