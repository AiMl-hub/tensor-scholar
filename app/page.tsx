import PaperSearchApp from "@/app/papers/paper-search-app";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/app/lib/seo";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "ResearchApplication",
  operatingSystem: "Any",
  creator: {
    "@type": "Person",
    name: "Mai A. Shaaban",
    url: "https://mai-cs.github.io",
    sameAs: ["https://www.linkedin.com/in/maiahmed"],
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Search A*/A AI conference papers",
    "Filter by title, abstract, author, venue, date window, and keywords",
    "Rank papers by relevance, recency, and citations",
    "Export selected papers to BibTeX, RIS, and CSV",
  ],
};

export default function Home() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />
      <PaperSearchApp />
    </>
  );
}
