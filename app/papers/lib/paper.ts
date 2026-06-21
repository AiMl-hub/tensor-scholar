import type { Paper } from "@/app/papers/types";

export function getPaperKey(paper: Paper) {
  return `${paper.source}:${paper.id}`;
}
