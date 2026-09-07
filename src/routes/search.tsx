import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard } from "@/components/site/ArticleCard";
import { articlesQuery } from "@/lib/queries";
import type { ArticleCard as ArticleCardType } from "@/lib/types";


export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"].slice(0, 120) : "",
  }),
  head: () => ({
    meta: [
      { title: "Search — GistPlugWealth" },
      { name: "description", content: "Search GistPlugWealth money guides, tips and resources." },
      { property: "og:title", content: "Search — GistPlugWealth" },
      { property: "og:description", content: "Search GistPlugWealth money guides and resources." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { data, isFetching } = useQuery({
    ...articlesQuery({ q, limit: 18 }),
    enabled: q.length > 0,
  });

  const items = (data?.items as unknown as ArticleCardType[]) ?? [];

  return (
    <SiteLayout>
      <div className="container-page py-12">
        <span className="eyebrow text-emerald">Search</span>
        <h1 className="mt-2 text-3xl sm:text-4xl">
          {q ? `Results for “${q}”` : "Search articles"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {q
            ? isFetching
              ? "Searching…"
              : `${data?.total ?? 0} article${(data?.total ?? 0) === 1 ? "" : "s"} found`
            : "Use the search box in the header to find a guide."}
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
