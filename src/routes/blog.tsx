import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard } from "@/components/site/ArticleCard";
import { Newsletter } from "@/components/site/Newsletter";
import { AdSlot } from "@/components/site/AdSlot";
import { articlesQuery } from "@/lib/queries";
import type { ArticleCard as ArticleCardType } from "@/lib/types";

const PAGE_SIZE = 9;
const TITLE = "All Articles — GistPlugWealth Money Guides";
const DESCRIPTION =
  "Browse every GistPlugWealth guide on making money online, side hustles, saving, budgeting, investing and financial apps in Nigeria.";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(articlesQuery({ limit: PAGE_SIZE, offset: 0 }));
  },

  component: BlogPage,
});

function BlogPage() {
  const [page, setPage] = useState(0);
  const { data, isFetching } = useQuery(
    articlesQuery({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
  );

  const items = (data?.items as unknown as ArticleCardType[]) ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <SiteLayout>
      <div className="border-b border-border bg-primary-soft">
        <div className="container-page py-12">
          <span className="eyebrow text-emerald">Blog</span>
          <h1 className="mt-2 text-3xl sm:text-4xl">All articles</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{DESCRIPTION}</p>
        </div>
      </div>

      <div className="container-page py-12">
        <AdSlot className="mb-10" />

        {items.length === 0 && !isFetching ? (
          <p className="text-muted-foreground">No articles published yet. Check back soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-center gap-3 text-sm"
          >
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={page === 0}
              className="btn btn-sm btn-quiet"
            >
              Previous
            </button>
            <span className="text-muted-foreground">
              Page {page + 1} of {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(pages - 1, value + 1))}
              disabled={page >= pages - 1}
              className="btn btn-sm btn-quiet"
            >
              Next
            </button>
          </nav>
        ) : null}

        <div className="mt-16">
          <Newsletter />
        </div>
      </div>
    </SiteLayout>
  );
}
