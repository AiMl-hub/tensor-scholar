# Tensor Scholar

A responsive Vinext/React webpage for searching machine learning, computer
vision, NLP, AI, and medical imaging conference papers by title, abstract, or
author across an adjustable date window.

Deployed: https://tensorscholar.vercel.app/

The search route queries Paper Digest, OpenAlex, and Semantic Scholar, filters
results to the curated A*/A-style venue catalog in `app/lib/venues.ts`, and
re-ranks with a hybrid lexical, recency, citation, venue-score, and source
model. Paper Digest contributes venue-scoped recent-paper recall and machine
highlight sentences; OpenAlex and Semantic Scholar abstracts get a query-focused
extractive highlight.

Search results can be selected in bulk and exported as BibTeX, RIS for
Zotero/Mendeley, or CSV with highlights and PDF URLs when available.

## Run

```bash
pnpm install
pnpm dev
pnpm build
```

Node.js `>=22.13.0` is required.

## Optional API Keys

The app works without keys, but public scholarly APIs may rate-limit anonymous
requests. Copy `.env.example` to `.env` and set either key when needed:

```bash
OPENALEX_API_KEY=
SEMANTIC_SCHOLAR_API_KEY=
```

## Source Catalog

Edit `app/lib/venues.ts` to add or remove conferences. The current catalog
includes NeurIPS, ICML, ICLR, KDD, AISTATS, UAI, AAAI, IJCAI, CVPR, ICCV, ECCV,
WACV, MICCAI, ACL, EMNLP, NAACL, EACL, COLING, and PMLR.
