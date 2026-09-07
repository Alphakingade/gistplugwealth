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
  const navigate = useNavigate();
  const { data, isFetching } = useQuery({
    ...articlesQuery({ q, limit: 18 }),
    enabled: q.length > 0,
  });

  const items = (data?.items as unknown as ArticleCardType[]) ?? [];
  const noResults = q.length > 0 && !isFetching && items.length === 0;

  return (
    <SiteLayout>
      <div className="container-page py-12">
        <span className="eyebrow text-emerald">Search</span>
        <h1 className="mt-2 text-3xl sm:text-4xl">
          {q ? `Results for “${q}”` : "Search articles"}
        </h1>

        <form
          role="search"
          className="mt-6 flex max-w-xl items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
            navigate({ to: "/search", search: { q: value } });
          }}
        >
          <label htmlFor="site-search" className="sr-only">
            Search articles
          </label>
          <div className="relative flex-1">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="site-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Try “side hustles” or “savings apps”"
              className="field w-full pl-9"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <p className="mt-4 text-muted-foreground">
          {q
            ? isFetching
              ? "Searching…"
              : `${data?.total ?? 0} article${(data?.total ?? 0) === 1 ? "" : "s"} found`
            : "Type a topic above to find a guide."}
        </p>

        {noResults ? (
          <div className="surface mt-8 max-w-xl p-8">
            <h2 className="text-xl">Nothing matched that search</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a shorter word, check the spelling, or browse everything we have published.
            </p>
            <Link to="/blog" className="btn btn-primary mt-5">
              Browse all articles
            </Link>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}

