import { PAGE_SIZE_OPTIONS, RESULT_LIMIT_OPTIONS } from "@/app/papers/constants";
import type { DateWindow, PageSize, ResultLimit } from "@/app/papers/types";

export function getDefaultDateWindow() {
  return getDateWindowForMonths(12);
}

export function getDateWindowForMonths(months: number): DateWindow {
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(to);
  from.setUTCMonth(from.getUTCMonth() - months);

  return {
    fromDate: toIsoDate(from),
    toDate: toIsoDate(to),
  };
}

export function isValidDateWindow(dateWindow: DateWindow) {
  return (
    isIsoDate(dateWindow.fromDate) &&
    isIsoDate(dateWindow.toDate) &&
    dateWindow.fromDate <= dateWindow.toDate
  );
}

export function parsePageSize(value: string): PageSize {
  const parsed = Number(value);
  return PAGE_SIZE_OPTIONS.includes(parsed as PageSize) ? (parsed as PageSize) : 10;
}

export function parseResultLimit(value: string): ResultLimit {
  const parsed = Number(value);
  return RESULT_LIMIT_OPTIONS.includes(parsed as ResultLimit) ? (parsed as ResultLimit) : 100;
}

export function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value;
}
