import { DEFAULT_VENUE_KEYS, VENUES, type Venue } from "@/app/lib/venues";
import type {
  Paper,
  SearchField,
  SearchPayload,
  SortMode,
  SourceName,
} from "@/app/papers/types";

export const dynamic = "force-dynamic";
export const runtime = "edge";

type OpenAlexWork = {
  id?: string;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  publication_date?: string | null;
  relevance_score?: number | null;
  primary_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  locations?: Array<{
    landing_page_url?: string | null;
    pdf_url?: string | null;
    source?: { display_name?: string | null } | null;
  }> | null;
  authorships?: Array<{
    author?: { display_name?: string | null } | null;
  }> | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  cited_by_count?: number | null;
  open_access?: { oa_url?: string | null } | null;
  ids?: { doi?: string | null } | null;
};

type SemanticScholarPaper = {
  paperId?: string;
  title?: string | null;
  abstract?: string | null;
  authors?: Array<{ name?: string | null }>;
  venue?: string | null;
  year?: number | null;
  citationCount?: number | null;
  influentialCitationCount?: number | null;
  url?: string | null;
  openAccessPdf?: { url?: string | null } | null;
  publicationDate?: string | null;
  externalIds?: { DOI?: string | null; ArXiv?: string | null } | null;
};

type PaperDigestPaper = {
  doc_id?: string | null;
  title?: string | null;
  topic?: string | null;
  authors?: string[] | null;
  raw_author_str?: string | null;
  from?: string | null;
  published_year?: number | null;
  published_date?: string | null;
  updated_date?: string | null;
  url?: string | null;
  score?: string | number | null;
  title_search?: string | null;
  title_html?: string | null;
  url_html?: string | null;
};

type PaperDigestRecord = {
  paper: PaperDigestPaper;
  venue: Venue;
};

const FIELD_WEIGHTS: Record<SearchField, Record<"title" | "abstract" | "author", number>> = {
  all: { title: 4.2, abstract: 2.4, author: 2.8 },
  title: { title: 6.4, abstract: 0.4, author: 0.2 },
  abstract: { title: 1.2, abstract: 6.2, author: 0.2 },
  titleAbstract: { title: 4.8, abstract: 4.4, author: 0.2 },
  author: { title: 0.2, abstract: 0.2, author: 7.2 },
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

const PAPER_DIGEST_TOPICS: Partial<Record<string, string>> = {
  neurips: "nips",
  icml: "icml",
  iclr: "iclr",
  kdd: "kdd",
  aistats: "aistats",
  uai: "uai",
  aaai: "aaai",
  ijcai: "ijcai",
  cvpr: "cvpr",
  iccv: "iccv",
  eccv: "eccv",
  wacv: "wacv",
  miccai: "miccai",
  acl: "acl",
  emnlp: "emnlp",
  naacl: "naacl",
  eacl: "eacl",
  coling: "coling",
};

const PAPER_DIGEST_ENDPOINT = "https://app.paperdigest.org/service/financekb/paper_search";
const PAPER_DIGEST_CONCURRENCY = 5;
const OPENALEX_PAGE_SIZE = 200;
const OPENALEX_MAX_PAGES = 5;
const SEMANTIC_SCHOLAR_PAGE_SIZE = 100;
const SEMANTIC_SCHOLAR_MAX_PAGES = 10;
const SEMANTIC_SCHOLAR_ENRICHMENT_LIMIT = 50;
const CANDIDATE_TARGET_MULTIPLIER = 2;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = cleanQuery(url.searchParams.get("q") ?? "");
  const field = parseField(url.searchParams.get("field"));
  const sort = parseSort(url.searchParams.get("sort"));
  const selectedVenues = parseVenues(url.searchParams.get("venues"));
  const includeKeywords = parseKeywordList(url.searchParams.get("include"));
  const excludeKeywords = parseKeywordList(url.searchParams.get("exclude"));
  const limit = clampNumber(Number(url.searchParams.get("limit") ?? 100), 5, 500);
  const { fromDate, toDate, yearRange } = parseDateWindow(
    url.searchParams.get("fromDate"),
    url.searchParams.get("toDate"),
  );

  if (!query) {
    return Response.json({
      papers: [],
      meta: {
        query,
        field,
        sort,
        selectedVenues,
        fromDate,
        toDate,
        includeKeywords,
        excludeKeywords,
        maxResults: limit,
        sourceCounts: { OpenAlex: 0, "Semantic Scholar": 0, "Paper Digest": 0 },
        errors: [],
      },
    } satisfies SearchPayload);
  }

  const selectedVenueSet = new Set(selectedVenues);
  const venues = VENUES.filter((venue) => selectedVenueSet.has(venue.key));
  const errors: string[] = [];

  const [openAlexResult, paperDigestResult] = await Promise.allSettled([
    searchOpenAlex(query, field, yearRange, limit),
    searchPaperDigest(query, venues, fromDate, toDate),
  ]);

  const collected: Paper[] = [];

  if (openAlexResult.status === "fulfilled") {
    for (const paper of openAlexResult.value) {
      const normalized = normalizePaper(paper, query, field, venues, fromDate, toDate);
      if (normalized) {
        collected.push(normalized);
      }
    }
  } else {
    errors.push(getUpstreamError(openAlexResult.reason, "OpenAlex"));
  }

  if (paperDigestResult.status === "fulfilled") {
    for (const item of paperDigestResult.value) {
      const normalized = normalizePaperDigestPaper(
        item.paper,
        query,
        field,
        item.venue,
        fromDate,
        toDate,
      );
      if (normalized) {
        collected.push(normalized);
      }
    }
  } else {
    errors.push(getUpstreamError(paperDigestResult.reason, "Paper Digest"));
  }

  const enrichedPapers = await enrichPapersWithSemanticScholar(
    dedupePapers(collected),
    query,
    field,
    venues,
    fromDate,
    toDate,
    yearRange,
  );
  const mergedPapers = enrichedPapers
    .filter((paper) => matchesKeywordFilters(paper, includeKeywords, excludeKeywords))
    .map((paper) => ({
      ...paper,
      score: scorePaper(paper, query, field, 0),
    }));
  const papers = sortPapers(mergedPapers, sort).slice(0, limit);
  const sourceCounts = countResultSources(papers);

  return Response.json({
    papers,
    meta: {
      query,
      field,
      sort,
      selectedVenues,
      fromDate,
      toDate,
      includeKeywords,
      excludeKeywords,
      maxResults: limit,
      sourceCounts,
      errors,
    },
  } satisfies SearchPayload);
}

async function searchOpenAlex(
  query: string,
  field: SearchField,
  yearRange: string,
  resultLimit: number,
): Promise<OpenAlexWork[]> {
  const worksUrl = new URL("https://api.openalex.org/works");
  worksUrl.searchParams.set("per-page", String(OPENALEX_PAGE_SIZE));
  worksUrl.searchParams.set(
    "select",
    [
      "id",
      "doi",
      "title",
      "display_name",
      "publication_year",
      "publication_date",
      "relevance_score",
      "primary_location",
      "locations",
      "authorships",
      "abstract_inverted_index",
      "cited_by_count",
      "open_access",
      "ids",
    ].join(","),
  );
  worksUrl.searchParams.set("filter", `publication_year:${yearRange}`);

  const apiKey = getEnvValue("OPENALEX_API_KEY");
  if (apiKey) {
    worksUrl.searchParams.set("api_key", apiKey);
  }

  if (field === "author") {
    return searchOpenAlexByAuthor(query, yearRange, apiKey, resultLimit);
  }

  worksUrl.searchParams.set("search", query);
  worksUrl.searchParams.set("sort", "relevance_score:desc");

  return fetchOpenAlexPages(worksUrl, resultLimit);
}

async function searchOpenAlexByAuthor(
  query: string,
  yearRange: string,
  apiKey: string | undefined,
  resultLimit: number,
): Promise<OpenAlexWork[]> {
  const authorsUrl = new URL("https://api.openalex.org/authors");
  authorsUrl.searchParams.set("search", query);
  authorsUrl.searchParams.set("per-page", "4");
  authorsUrl.searchParams.set("select", "id,display_name,works_count,cited_by_count");
  if (apiKey) {
    authorsUrl.searchParams.set("api_key", apiKey);
  }

  const authorsResponse = await fetch(authorsUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!authorsResponse.ok) {
    throw new Error(`${authorsResponse.status}`);
  }

  const authorsPayload = (await authorsResponse.json()) as {
    results?: Array<{ id?: string | null }>;
  };
  const ids = (authorsPayload.results ?? [])
    .map((author) => author.id)
    .filter((id): id is string => Boolean(id))
    .slice(0, 4);

  if (!ids.length) {
    return [];
  }

  const worksUrl = new URL("https://api.openalex.org/works");
  worksUrl.searchParams.set("per-page", String(OPENALEX_PAGE_SIZE));
  worksUrl.searchParams.set(
    "select",
    [
      "id",
      "doi",
      "title",
      "display_name",
      "publication_year",
      "publication_date",
      "relevance_score",
      "primary_location",
      "locations",
      "authorships",
      "abstract_inverted_index",
      "cited_by_count",
      "open_access",
      "ids",
    ].join(","),
  );
  worksUrl.searchParams.set(
    "filter",
    `publication_year:${yearRange},authorships.author.id:${ids.join("|")}`,
  );
  worksUrl.searchParams.set("sort", "publication_date:desc");
  if (apiKey) {
    worksUrl.searchParams.set("api_key", apiKey);
  }

  return fetchOpenAlexPages(worksUrl, resultLimit);
}

async function fetchOpenAlexPages(worksUrl: URL, resultLimit: number): Promise<OpenAlexWork[]> {
  const targetCount = getCandidateTarget(resultLimit);
  const maxPages = Math.min(OPENALEX_MAX_PAGES, Math.ceil(targetCount / OPENALEX_PAGE_SIZE));
  const works: OpenAlexWork[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const pageUrl = new URL(worksUrl);
    pageUrl.searchParams.set("page", String(page));

    const response = await fetch(pageUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    const payload = (await response.json()) as { results?: OpenAlexWork[] };
    const pageResults = payload.results ?? [];
    works.push(...pageResults);

    if (pageResults.length < OPENALEX_PAGE_SIZE || works.length >= targetCount) {
      break;
    }
  }

  return works.slice(0, targetCount);
}

function getCandidateTarget(resultLimit: number) {
  return Math.min(resultLimit * CANDIDATE_TARGET_MULTIPLIER, 1000);
}

async function searchSemanticScholar(
  query: string,
  yearRange: string,
  resultLimit: number,
): Promise<SemanticScholarPaper[]> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = getEnvValue("SEMANTIC_SCHOLAR_API_KEY");
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const targetCount = getCandidateTarget(resultLimit);
  const maxPages = Math.min(
    SEMANTIC_SCHOLAR_MAX_PAGES,
    Math.ceil(targetCount / SEMANTIC_SCHOLAR_PAGE_SIZE),
  );
  const papers: SemanticScholarPaper[] = [];
  let offset = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const searchUrl = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("year", yearRange);
    searchUrl.searchParams.set("limit", String(SEMANTIC_SCHOLAR_PAGE_SIZE));
    searchUrl.searchParams.set("offset", String(offset));
    searchUrl.searchParams.set(
      "fields",
      [
        "paperId",
        "title",
        "abstract",
        "authors",
        "venue",
        "year",
        "citationCount",
        "influentialCitationCount",
        "url",
        "openAccessPdf",
        "publicationDate",
        "externalIds",
      ].join(","),
    );

    const response = await fetch(searchUrl, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: SemanticScholarPaper[];
      next?: number | null;
    };
    const pageResults = payload.data ?? [];
    papers.push(...pageResults);

    if (pageResults.length < SEMANTIC_SCHOLAR_PAGE_SIZE || papers.length >= targetCount) {
      break;
    }

    const nextOffset =
      typeof payload.next === "number" ? payload.next : offset + SEMANTIC_SCHOLAR_PAGE_SIZE;
    if (nextOffset <= offset) {
      break;
    }
    offset = nextOffset;
  }

  return papers.slice(0, targetCount);
}

async function searchPaperDigest(
  query: string,
  venues: Venue[],
  fromDate: string,
  toDate: string,
): Promise<PaperDigestRecord[]> {
  const supportedVenues = venues.filter((venue) => PAPER_DIGEST_TOPICS[venue.key]);
  if (!supportedVenues.length) {
    return [];
  }

  let failures = 0;
  const records = await runLimited(supportedVenues, PAPER_DIGEST_CONCURRENCY, async (venue) => {
    try {
      return await fetchPaperDigestVenue(query, venue, fromDate, toDate);
    } catch {
      failures += 1;
      return [];
    }
  });

  if (!records.length && failures === supportedVenues.length) {
    throw new Error("unavailable");
  }

  return records;
}

async function fetchPaperDigestVenue(
  query: string,
  venue: Venue,
  fromDate: string,
  toDate: string,
): Promise<PaperDigestRecord[]> {
  const topic = PAPER_DIGEST_TOPICS[venue.key];
  if (!topic) {
    return [];
  }

  const response = await fetch(PAPER_DIGEST_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: "https://www.paperdigest.org",
      Referer: `https://www.paperdigest.org/digest/?topic=${topic}`,
    },
    body: JSON.stringify({
      area: "*",
      filter_1_type: topic,
      time: "latest_5",
      topic: query,
      use_short_list: "true",
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  const payload = (await response.json()) as {
    result?: PaperDigestPaper[];
    error?: string | null;
    error_message?: string | null;
  };

  if (payload.error || payload.error_message) {
    throw new Error(payload.error ?? payload.error_message ?? "unavailable");
  }

  return (payload.result ?? [])
    .filter((paper) => {
      const publicationDate = normalizeDate(
        paper.published_date ?? paper.updated_date,
        paper.published_year ?? null,
      );
      return isInDateWindow(publicationDate, paper.published_year ?? null, fromDate, toDate);
    })
    .map((paper) => ({ paper, venue }));
}

function normalizePaper(
  paper: OpenAlexWork | SemanticScholarPaper,
  query: string,
  field: SearchField,
  venues: Venue[],
  fromDate: string,
  toDate: string,
): Paper | null {
  if ("paperId" in paper) {
    return normalizeSemanticScholarPaper(paper, query, field, venues, fromDate, toDate);
  }

  return normalizeOpenAlexPaper(paper, query, field, venues, fromDate, toDate);
}

function getUpstreamError(reason: unknown, source: SourceName) {
  const status = reason instanceof Error ? reason.message : "";

  if (status === "429") {
    return `${source} rate limit reached. Add an optional API key to raise limits.`;
  }

  if (status === "403" || status === "401") {
    return `${source} rejected the request. Check the optional API key.`;
  }

  return `${source} search is temporarily unavailable.`;
}

function normalizeOpenAlexPaper(
  work: OpenAlexWork,
  query: string,
  field: SearchField,
  venues: Venue[],
  fromDate: string,
  toDate: string,
): Paper | null {
  const title = cleanTitle(work.title ?? work.display_name ?? "");
  if (!title) {
    return null;
  }

  const sourceNames = getOpenAlexSourceNames(work);
  const venue = matchVenue(sourceNames.join(" "), venues);
  if (!venue) {
    return null;
  }

  const year = work.publication_year ?? null;
  const publicationDate = normalizeDate(work.publication_date, year);
  if (!isInDateWindow(publicationDate, year, fromDate, toDate)) {
    return null;
  }

  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const authors =
    work.authorships
      ?.map((authorship) => authorship.author?.display_name?.trim())
      .filter((name): name is string => Boolean(name)) ?? [];

  const paper: Paper = {
    id: work.id ?? work.doi ?? `${title}-${year ?? "unknown"}`,
    title,
    abstract,
    highlight: makeExtractiveHighlight(abstract, title, query),
    authors,
    venue: sourceNames[0] ?? venue.fullName,
    venueKey: venue.key,
    venueLabel: venue.label,
    area: venue.area,
    rank: venue.rank,
    year,
    publicationDate,
    citationCount: work.cited_by_count ?? 0,
    influentialCitationCount: null,
    url: work.primary_location?.landing_page_url ?? work.id ?? null,
    pdfUrl:
      work.primary_location?.pdf_url ??
      work.open_access?.oa_url ??
      work.locations?.find((location) => location.pdf_url)?.pdf_url ??
      null,
    doi: normalizeDoi(work.doi ?? work.ids?.doi ?? null),
    source: "OpenAlex",
    score: 0,
  };

  if (!matchesSelectedField(paper, query, field)) {
    return null;
  }

  paper.score = scorePaper(paper, query, field, work.relevance_score ?? 0);
  return paper;
}

function normalizeSemanticScholarPaper(
  sourcePaper: SemanticScholarPaper,
  query: string,
  field: SearchField,
  venues: Venue[],
  fromDate: string,
  toDate: string,
): Paper | null {
  const title = cleanTitle(sourcePaper.title ?? "");
  if (!title) {
    return null;
  }

  const venue = matchVenue(sourcePaper.venue ?? "", venues);
  if (!venue) {
    return null;
  }

  const year = sourcePaper.year ?? null;
  const publicationDate = normalizeDate(sourcePaper.publicationDate, year);
  if (!isInDateWindow(publicationDate, year, fromDate, toDate)) {
    return null;
  }

  const abstract = sourcePaper.abstract?.trim() || null;
  const paper: Paper = {
    id: sourcePaper.paperId ?? sourcePaper.externalIds?.DOI ?? `${title}-${year ?? "unknown"}`,
    title,
    abstract,
    highlight: makeExtractiveHighlight(abstract, title, query),
    authors:
      sourcePaper.authors
        ?.map((author) => author.name?.trim())
        .filter((name): name is string => Boolean(name)) ?? [],
    venue: sourcePaper.venue ?? venue.fullName,
    venueKey: venue.key,
    venueLabel: venue.label,
    area: venue.area,
    rank: venue.rank,
    year,
    publicationDate,
    citationCount: sourcePaper.citationCount ?? 0,
    influentialCitationCount: sourcePaper.influentialCitationCount ?? null,
    url: sourcePaper.url ?? null,
    pdfUrl: sourcePaper.openAccessPdf?.url ?? null,
    doi: normalizeDoi(sourcePaper.externalIds?.DOI ?? null),
    source: "Semantic Scholar",
    score: 0,
  };

  if (!matchesSelectedField(paper, query, field)) {
    return null;
  }

  paper.score = scorePaper(paper, query, field, 0);
  return paper;
}

async function enrichPapersWithSemanticScholar(
  papers: Paper[],
  query: string,
  field: SearchField,
  venues: Venue[],
  fromDate: string,
  toDate: string,
  yearRange: string,
) {
  if (!papers.some(needsSemanticScholarEnrichment)) {
    return papers;
  }

  try {
    const enrichmentCandidates = (await searchSemanticScholar(
      query,
      yearRange,
      SEMANTIC_SCHOLAR_ENRICHMENT_LIMIT,
    ))
      .map((paper) => normalizeSemanticScholarPaper(paper, query, field, venues, fromDate, toDate))
      .filter((paper): paper is Paper => Boolean(paper));

    if (!enrichmentCandidates.length) {
      return papers;
    }

    return papers.map((paper) => {
      const enrichment = enrichmentCandidates.find((candidate) => areDuplicatePapers(paper, candidate));
      return enrichment ? mergeSemanticScholarEnrichment(paper, enrichment) : paper;
    });
  } catch {
    return papers;
  }
}

function needsSemanticScholarEnrichment(paper: Paper) {
  return (
    !paper.abstract ||
    !paper.pdfUrl ||
    !paper.doi ||
    !paper.authors.length ||
    paper.citationCount === 0 ||
    paper.influentialCitationCount === null
  );
}

function mergeSemanticScholarEnrichment(base: Paper, enrichment: Paper): Paper {
  const publicationDate = chooseLatestDate(base.publicationDate, enrichment.publicationDate);

  return {
    ...base,
    title: chooseTitle(base.title, enrichment.title),
    abstract: chooseLongerText(base.abstract, enrichment.abstract),
    highlight: chooseHighlight(base, enrichment),
    authors: base.authors.length >= enrichment.authors.length ? base.authors : enrichment.authors,
    year: publicationDate ? Number(publicationDate.slice(0, 4)) : base.year ?? enrichment.year,
    publicationDate,
    citationCount: Math.max(base.citationCount, enrichment.citationCount),
    influentialCitationCount:
      Math.max(base.influentialCitationCount ?? 0, enrichment.influentialCitationCount ?? 0) || null,
    url: chooseUrl(base.url, enrichment.url),
    pdfUrl: base.pdfUrl ?? enrichment.pdfUrl,
    doi: base.doi ?? enrichment.doi,
    score: Math.max(base.score, enrichment.score),
  };
}

function normalizePaperDigestPaper(
  sourcePaper: PaperDigestPaper,
  query: string,
  field: SearchField,
  venue: Venue,
  fromDate: string,
  toDate: string,
): Paper | null {
  const title = cleanTitle(sourcePaper.title ?? "");
  if (!title) {
    return null;
  }

  const year = sourcePaper.published_year ?? null;
  const publicationDate = normalizeDate(sourcePaper.published_date ?? sourcePaper.updated_date, year);
  if (!isInDateWindow(publicationDate, year, fromDate, toDate)) {
    return null;
  }

  const highlight = getPaperDigestHighlight(sourcePaper);
  const url = normalizeUrl(sourcePaper.url) ?? extractFirstHref(sourcePaper.url_html);
  const paper: Paper = {
    id: sourcePaper.doc_id ?? `${venue.key}-${title}-${year ?? "unknown"}`,
    title,
    abstract: null,
    highlight,
    authors: getPaperDigestAuthors(sourcePaper),
    venue: (sourcePaper.from ?? venue.label).toUpperCase(),
    venueKey: venue.key,
    venueLabel: venue.label,
    area: venue.area,
    rank: venue.rank,
    year,
    publicationDate,
    citationCount: 0,
    influentialCitationCount: null,
    url: url ?? extractFirstHref(sourcePaper.title_html) ?? extractFirstHref(sourcePaper.title_search),
    pdfUrl: getPdfUrl(url),
    doi: null,
    source: "Paper Digest",
    score: 0,
  };

  if (!matchesSelectedField(paper, query, field)) {
    return null;
  }

  paper.score = scorePaper(paper, query, field, Number(sourcePaper.score ?? 0) || 0);
  return paper;
}

function scorePaper(
  paper: Paper,
  query: string,
  field: SearchField,
  upstreamScore: number,
) {
  const weights = FIELD_WEIGHTS[field];
  const searchableAbstract = getSearchableAbstract(paper);
  const titleScore = lexicalScore(query, paper.title) * weights.title;
  const abstractScore = lexicalScore(query, searchableAbstract) * weights.abstract;
  const authorScore = lexicalScore(query, paper.authors.join(" ")) * weights.author;
  const relevanceScore = Math.min(titleScore + abstractScore + authorScore, 4.2);
  const recencyScore = getRecencyScore(paper.publicationDate, paper.year) * 1.45;
  const citationScore = getCitationScore(paper.citationCount, paper.influentialCitationCount);
  const venueScore = paper.rank === "A*" ? 1.3 : 0.8;
  const sourceScore = getSourceScore(paper, upstreamScore);

  return Number(
    (
      relevanceScore +
      recencyScore +
      citationScore +
      venueScore +
      sourceScore
    ).toFixed(4),
  );
}

function getCitationScore(citationCount: number, influentialCitationCount: number | null) {
  const citationScore = Math.min(Math.log10(citationCount + 1) * 2.25, 6.5);
  const influenceScore = Math.min(Math.log10((influentialCitationCount ?? 0) + 1) * 1.2, 1.4);
  return citationScore + influenceScore;
}

function getSourceScore(paper: Paper, upstreamScore: number) {
  if (paper.source === "Paper Digest") {
    return 1.8 + (paper.highlight ? 0.5 : 0) + Math.min(upstreamScore * 1.2, 1.2);
  }

  if (paper.source === "OpenAlex") {
    return 0.8 + Math.min(upstreamScore / 160, 1.2);
  }

  return 0.8;
}

function matchesSelectedField(paper: Paper, query: string, field: SearchField) {
  const searchableAbstract = getSearchableAbstract(paper);

  if (field === "title") {
    return lexicalScore(query, paper.title) > 0;
  }

  if (field === "abstract") {
    return Boolean(searchableAbstract) && lexicalScore(query, searchableAbstract) > 0;
  }

  if (field === "titleAbstract") {
    return lexicalScore(query, paper.title) > 0 || lexicalScore(query, searchableAbstract) > 0;
  }

  if (field === "author") {
    return tokenCoverage(query, paper.authors.join(" ")) >= 0.66;
  }

  return (
    lexicalScore(query, paper.title) > 0 ||
    lexicalScore(query, searchableAbstract) > 0 ||
    lexicalScore(query, paper.authors.join(" ")) > 0
  );
}

function matchesKeywordFilters(
  paper: Paper,
  includeKeywords: string[],
  excludeKeywords: string[],
) {
  if (!includeKeywords.length && !excludeKeywords.length) {
    return true;
  }

  const searchableText = getKeywordSearchText(paper);
  return (
    includeKeywords.every((keyword) => containsKeyword(searchableText, keyword)) &&
    !excludeKeywords.some((keyword) => containsKeyword(searchableText, keyword))
  );
}

function getKeywordSearchText(paper: Paper) {
  return normalizeText(
    [
      paper.title,
      paper.abstract,
      paper.highlight,
      paper.authors.join(" "),
      paper.venue,
      paper.venueLabel,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function containsKeyword(normalizedText: string, keyword: string) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) {
    return false;
  }

  if (` ${normalizedText} `.includes(` ${normalizedKeyword} `)) {
    return true;
  }

  const textTokens = normalizedText.split(" ").filter(Boolean);
  const keywordTokens = normalizedKeyword.split(" ").filter(Boolean);
  if (!textTokens.length || !keywordTokens.length) {
    return false;
  }

  if (keywordTokens.length === 1) {
    const keywordStem = stemKeywordToken(keywordTokens[0]);
    return textTokens.some((token) => stemKeywordToken(token) === keywordStem);
  }

  const keywordStems = keywordTokens.map(stemKeywordToken);
  for (let index = 0; index <= textTokens.length - keywordStems.length; index += 1) {
    const matchesPhrase = keywordStems.every(
      (stem, offset) => stemKeywordToken(textTokens[index + offset]) === stem,
    );
    if (matchesPhrase) {
      return true;
    }
  }

  return false;
}

function stemKeywordToken(token: string) {
  if (token.length <= 4) {
    return token;
  }

  if (token.endsWith("ies") && token.length > 5) {
    return `${token.slice(0, -3)}y`;
  }

  for (const suffix of ["ization", "ational", "fulness", "ousness", "iveness", "ingly", "edly", "ation", "ment", "ness", "able", "ible", "ing", "ers", "ies", "ied", "ed", "es", "s"]) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      return token.slice(0, -suffix.length);
    }
  }

  return token;
}

function getSearchableAbstract(paper: Paper) {
  return [paper.abstract, paper.highlight].filter(Boolean).join(" ");
}

function lexicalScore(query: string, text: string) {
  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);
  if (!normalizedQuery || !normalizedText) {
    return 0;
  }

  const queryTokens = tokenize(normalizedQuery);
  if (!queryTokens.length) {
    return normalizedText.includes(normalizedQuery) ? 1 : 0;
  }

  let score = normalizedText.includes(normalizedQuery) ? 4 : 0;
  const textTokens = tokenize(normalizedText);
  const textFrequency = new Map<string, number>();
  for (const token of textTokens) {
    textFrequency.set(token, (textFrequency.get(token) ?? 0) + 1);
  }

  for (const token of queryTokens) {
    const frequency = textFrequency.get(token) ?? 0;
    if (frequency > 0) {
      score += 1.5 + Math.min(frequency, 4) * 0.35;
      continue;
    }

    if (normalizedText.includes(token)) {
      score += 0.8;
    }
  }

  return score * tokenCoverage(query, text);
}

function tokenCoverage(query: string, text: string) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) {
    return 0;
  }

  const normalizedText = normalizeText(text);
  const matched = queryTokens.filter((token) => normalizedText.includes(token));
  return matched.length / queryTokens.length;
}

function makeExtractiveHighlight(abstract: string | null, title: string, query: string) {
  if (!abstract) {
    return null;
  }

  const sentences = splitSentences(abstract)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40);
  if (!sentences.length) {
    return null;
  }

  const bestSentence =
    sentences
      .map((sentence, index) => ({
        sentence,
        index,
        score:
          lexicalScore(query, sentence) * 2 +
          lexicalScore(title, sentence) * 0.15 -
          Math.max(0, sentence.length - 340) / 180,
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.sentence ?? sentences[0];

  return trimText(bestSentence, 360);
}

function splitSentences(value: string) {
  return value.replace(/\s+/g, " ").match(/[^.!?]+(?:[.!?]+|$)/g) ?? [];
}

function getPaperDigestHighlight(sourcePaper: PaperDigestPaper) {
  const rawHighlight =
    sourcePaper.topic ??
    extractHighlightFromHtml(sourcePaper.title_search) ??
    extractHighlightFromHtml(sourcePaper.title_html);

  if (!rawHighlight) {
    return null;
  }

  return trimText(
    stripHtml(rawHighlight)
      .replace(/^highlight\s*:\s*/i, "")
      .replace(/\s+([,.;:?!])/g, "$1"),
    420,
  );
}

function extractHighlightFromHtml(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match =
    value.match(/<u>\s*Highlight\s*<\/u>\s*:\s*([\s\S]*?)(?:<\/i>|<\/small>|$)/i) ??
    value.match(/Highlight\s*:\s*([\s\S]*?)(?:<\/i>|<\/small>|$)/i);
  return match?.[1] ?? null;
}

function getPaperDigestAuthors(sourcePaper: PaperDigestPaper) {
  if (Array.isArray(sourcePaper.authors)) {
    return sourcePaper.authors.map((author) => author.trim()).filter(Boolean);
  }

  return (sourcePaper.raw_author_str ?? "")
    .split(/[,;]\s+/)
    .map((author) => author.trim())
    .filter(Boolean);
}

function getPdfUrl(url: string | null) {
  if (!url) {
    return null;
  }

  const arxivMatch = url.match(/arxiv\.org\/abs\/([^/?#]+)/i);
  if (arxivMatch) {
    return `https://arxiv.org/pdf/${arxivMatch[1]}`;
  }

  if (/\.pdf(?:$|[?#])/i.test(url)) {
    return url;
  }

  return null;
}

function extractFirstHref(value: string | null | undefined) {
  const match = value?.match(/href=["']([^"']+)["']/i);
  return normalizeUrl(match?.[1] ?? null);
}

function normalizeUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `https://www.paperdigest.org${trimmed}`;
  }

  return null;
}

function stripHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    const named: Record<string, string> = {
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      nbsp: " ",
      quot: '"',
    };
    const normalized = code.toLowerCase();
    if (named[normalized]) {
      return named[normalized];
    }

    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }

    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }

    return entity;
  });
}

function trimText(value: string, maxLength: number) {
  const cleanValue = value.replace(/\s+/g, " ").trim();
  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

async function runLimited<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R[]>,
) {
  const results: R[] = [];
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        results.push(...(await worker(item)));
      }
    }),
  );

  return results;
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function countResultSources(papers: Paper[]): Record<SourceName, number> {
  return papers.reduce<Record<SourceName, number>>(
    (counts, paper) => {
      counts[paper.source] += 1;
      return counts;
    },
    { OpenAlex: 0, "Semantic Scholar": 0, "Paper Digest": 0 },
  );
}

function dedupePapers(papers: Paper[]) {
  const merged: Paper[] = [];

  for (const paper of papers) {
    const existingIndex = merged.findIndex((candidate) => areDuplicatePapers(candidate, paper));
    if (existingIndex >= 0) {
      merged[existingIndex] = mergeDuplicatePapers(merged[existingIndex], paper);
    } else {
      merged.push(paper);
    }
  }

  return merged;
}

function areDuplicatePapers(a: Paper, b: Paper) {
  if (a.doi && b.doi && a.doi === b.doi) {
    return true;
  }

  if (!hasCompatibleYears(a, b)) {
    return false;
  }

  const titleA = getTitleFingerprint(a.title);
  const titleB = getTitleFingerprint(b.title);
  if (!titleA.normalized || !titleB.normalized) {
    return false;
  }

  if (titleA.normalized === titleB.normalized) {
    return true;
  }

  if (titleA.compact === titleB.compact && Math.min(titleA.compact.length, titleB.compact.length) >= 24) {
    return true;
  }

  if (titleA.tokens.length < 5 || titleB.tokens.length < 5) {
    return false;
  }

  const overlap = countTokenOverlap(titleA.tokens, titleB.tokens);
  const containment = overlap / Math.min(titleA.tokens.length, titleB.tokens.length);
  const jaccard = overlap / new Set([...titleA.tokens, ...titleB.tokens]).size;

  return containment >= 0.92 && jaccard >= 0.85;
}

function mergeDuplicatePapers(a: Paper, b: Paper): Paper {
  const primary = a.score >= b.score ? a : b;
  const secondary = primary === a ? b : a;
  const abstract = chooseLongerText(a.abstract, b.abstract);
  const highlight = chooseHighlight(a, b);
  const publicationDate = chooseLatestDate(a.publicationDate, b.publicationDate);

  return {
    ...primary,
    id: chooseStableId(a, b),
    title: chooseTitle(a.title, b.title),
    abstract,
    highlight,
    authors: a.authors.length >= b.authors.length ? a.authors : b.authors,
    venue: primary.venue || secondary.venue,
    venueKey: primary.venueKey || secondary.venueKey,
    venueLabel: primary.venueLabel || secondary.venueLabel,
    area: primary.area,
    rank: a.rank === "A*" || b.rank === "A*" ? "A*" : primary.rank,
    year: publicationDate ? Number(publicationDate.slice(0, 4)) : primary.year ?? secondary.year,
    publicationDate,
    citationCount: Math.max(a.citationCount, b.citationCount),
    influentialCitationCount: Math.max(a.influentialCitationCount ?? 0, b.influentialCitationCount ?? 0) || null,
    url: chooseUrl(a.url, b.url),
    pdfUrl: a.pdfUrl ?? b.pdfUrl,
    doi: a.doi ?? b.doi,
    source: chooseMergedSource(a, b, primary),
    score: Math.max(a.score, b.score),
  };
}

function hasCompatibleYears(a: Paper, b: Paper) {
  if (!a.year || !b.year) {
    return true;
  }

  return Math.abs(a.year - b.year) <= 1;
}

function getTitleFingerprint(title: string) {
  const normalized = normalizeText(title);
  const tokens = tokenize(normalized).filter((token) => token.length > 2);

  return {
    normalized,
    compact: normalized.replace(/\s+/g, ""),
    tokens: Array.from(new Set(tokens)),
  };
}

function countTokenOverlap(tokensA: string[], tokensB: string[]) {
  const tokenSetB = new Set(tokensB);
  return tokensA.filter((token) => tokenSetB.has(token)).length;
}

function chooseStableId(a: Paper, b: Paper) {
  if (a.doi) {
    return a.id;
  }

  if (b.doi) {
    return b.id;
  }

  if (a.source !== "Paper Digest") {
    return a.id;
  }

  if (b.source !== "Paper Digest") {
    return b.id;
  }

  return a.score >= b.score ? a.id : b.id;
}

function chooseTitle(titleA: string, titleB: string) {
  if (titleA.length === titleB.length) {
    return titleA;
  }

  return titleA.length > titleB.length ? titleA : titleB;
}

function chooseLongerText(a: string | null, b: string | null) {
  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  return a.length >= b.length ? a : b;
}

function chooseHighlight(a: Paper, b: Paper) {
  if (a.source === "Paper Digest" && a.highlight) {
    return a.highlight;
  }

  if (b.source === "Paper Digest" && b.highlight) {
    return b.highlight;
  }

  return chooseLongerText(a.highlight, b.highlight);
}

function chooseLatestDate(a: string | null, b: string | null) {
  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  return a >= b ? a : b;
}

function chooseUrl(a: string | null, b: string | null) {
  if (a && !isPaperDigestUrl(a)) {
    return a;
  }

  if (b && !isPaperDigestUrl(b)) {
    return b;
  }

  return a ?? b;
}

function isPaperDigestUrl(value: string) {
  return /^https?:\/\/(www\.)?paperdigest\.org\//i.test(value);
}

function chooseMergedSource(a: Paper, b: Paper, primary: Paper): SourceName {
  if (a.source === "Paper Digest" || b.source === "Paper Digest") {
    return "Paper Digest";
  }

  return primary.source;
}

function sortPapers(papers: Paper[], sort: SortMode) {
  return [...papers].sort((a, b) => {
    if (sort === "newest") {
      return compareDate(b, a) || b.score - a.score;
    }

    if (sort === "citations") {
      return b.citationCount - a.citationCount || b.score - a.score;
    }

    return b.score - a.score || compareDate(b, a);
  });
}

function compareDate(a: Paper, b: Paper) {
  const dateA = a.publicationDate ?? `${a.year ?? 0}-01-01`;
  const dateB = b.publicationDate ?? `${b.year ?? 0}-01-01`;
  return dateA.localeCompare(dateB);
}

function getOpenAlexSourceNames(work: OpenAlexWork) {
  const names = [
    work.primary_location?.source?.display_name,
    ...(work.locations?.map((location) => location.source?.display_name) ?? []),
  ];

  return Array.from(
    new Set(names.map((name) => name?.trim()).filter((name): name is string => Boolean(name))),
  );
}

function matchVenue(sourceText: string, venues: Venue[]) {
  const normalized = normalizeText(sourceText);
  if (!normalized) {
    return null;
  }

  return (
    venues.find((venue) =>
      venue.aliases.some((alias) => containsAlias(normalized, normalizeText(alias))),
    ) ?? null
  );
}

function containsAlias(normalizedText: string, normalizedAlias: string) {
  if (!normalizedAlias) {
    return false;
  }

  if (normalizedAlias.length <= 6) {
    const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedAlias)}($|\\s)`);
    return pattern.test(normalizedText);
  }

  return normalizedText.includes(normalizedAlias);
}

function reconstructAbstract(index: Record<string, number[]> | null | undefined) {
  if (!index) {
    return null;
  }

  const words: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) {
      words.push([position, word]);
    }
  }

  if (!words.length) {
    return null;
  }

  return words
    .sort(([a], [b]) => a - b)
    .map(([, word]) => word)
    .join(" ")
    .replace(/\s+([,.;:?!])/g, "$1");
}

function getDefaultDateWindow() {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const from = new Date(to);
  from.setUTCFullYear(from.getUTCFullYear() - 1);

  return {
    fromDate: toIsoDate(from),
    toDate: toIsoDate(to),
    yearRange: `${from.getUTCFullYear()}-${to.getUTCFullYear()}`,
  };
}

function parseDateWindow(fromValue: string | null, toValue: string | null) {
  const fallback = getDefaultDateWindow();
  let fromDate = parseIsoDate(fromValue) ?? fallback.fromDate;
  let toDate = parseIsoDate(toValue) ?? fallback.toDate;

  if (toDate > fallback.toDate) {
    toDate = fallback.toDate;
  }

  if (fromDate > toDate) {
    [fromDate, toDate] = [toDate, fromDate];
  }

  return {
    fromDate,
    toDate,
    yearRange: `${fromDate.slice(0, 4)}-${toDate.slice(0, 4)}`,
  };
}

function getRecencyScore(publicationDate: string | null, year: number | null) {
  if (!publicationDate && !year) {
    return 0;
  }

  const now = new Date();
  const paperDate = publicationDate
    ? new Date(`${publicationDate}T00:00:00Z`)
    : new Date(Date.UTC(year ?? now.getUTCFullYear(), 0, 1));
  const months = Math.max(
    0,
    (now.getTime() - paperDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
  );

  return Math.max(0, 3.2 - months * 0.09);
}

function isInDateWindow(
  publicationDate: string | null,
  year: number | null,
  fromDate: string,
  toDate: string,
) {
  if (publicationDate) {
    return publicationDate >= fromDate && publicationDate <= toDate;
  }

  const fromYear = Number(fromDate.slice(0, 4));
  const toYear = Number(toDate.slice(0, 4));
  return year !== null && year >= fromYear && year <= toYear;
}

function normalizeDate(value: string | null | undefined, year: number | null) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (value && /^\d{4}$/.test(value)) {
    return `${value}-01-01`;
  }

  return year ? `${year}-01-01` : null;
}

function parseField(value: string | null): SearchField {
  return value === "title" ||
    value === "abstract" ||
    value === "titleAbstract" ||
    value === "author"
    ? value
    : "all";
}

function parseSort(value: string | null): SortMode {
  return value === "newest" || value === "citations" ? value : "relevance";
}

function parseVenues(value: string | null) {
  if (!value) {
    return DEFAULT_VENUE_KEYS;
  }

  const requested = new Set(value.split(",").map((key) => key.trim()).filter(Boolean));
  const selected = VENUES.filter((venue) => requested.has(venue.key)).map((venue) => venue.key);
  return selected.length ? selected : DEFAULT_VENUE_KEYS;
}

function parseKeywordList(value: string | null) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[,;\n]+/)
        .map((keyword) => keyword.replace(/\s+/g, " ").trim().slice(0, 80))
        .filter(Boolean),
    ),
  ).slice(0, 16);
}

function cleanQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

function cleanTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeDoi(value: string | null) {
  return value?.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase().trim() || null;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseIsoDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toIsoDate(parsed) === value ? value : null;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function getEnvValue(key: string) {
  if (typeof process === "undefined") {
    return undefined;
  }

  return process.env?.[key];
}
