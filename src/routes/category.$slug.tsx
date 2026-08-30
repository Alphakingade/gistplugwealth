import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard } from "@/components/site/ArticleCard";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { Newsletter } from "@/components/site/Newsletter";
import { AdSlot } from "@/components/site/AdSlot";
import { articlesQuery, categoryQuery } from "@/lib/queries";
import { SITE } from "@/lib/site";
import type { ArticleCard as ArticleCardType, Category } from "@/lib/types";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ context, params }) => {
    const category = (await context.queryClient.ensureQueryData(
      categoryQuery(params.slug),
    )) as Category | null;
    if (!category) throw notFound();
    void context.queryClient.ensureQueryData(
      articlesQuery({ categorySlug: params.slug, limit: 12 }),
    );
    return { category };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Category not found" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.category.name} — ${SITE.name}`;
    const description =
      loaderData.category.description ??
      `Read ${SITE.name} guides and tips in the ${loaderData.category.name} category.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: CategoryNotFound,
  component: CategoryPage,
});

function CategoryNotFound() {
  return (
    <SiteLayout>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl">Category not found</h1>
        <p className="mt-3 text-muted-foreground">
          That category doesn&apos;t exist. Browse all our articles instead.
        </p>
        <Link
          to="/blog"
          className="btn btn-primary mt-6"
        >
          Go to blog
        </Link>
      </div>
    </SiteLayout>
  );
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const { category } = Route.useLoaderData();
  const { data } = useSuspenseQuery(articlesQuery({ categorySlug: slug, limit: 12 }));
  const items = (data.items as unknown as ArticleCardType[]) ?? [];

  return (
    <SiteLayout>
      <div className="border-b border-border bg-primary-soft">
        <div className="container-page flex items-start gap-4 py-12">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CategoryIcon name={category.icon ?? category.name} className="h-6 w-6" />
          </span>
          <div>
            <span className="eyebrow text-emerald">Category</span>
            <h1 className="mt-1 text-3xl sm:text-4xl">{category.name}</h1>
            {category.description ? (
              <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container-page py-12">
        <AdSlot className="mb-10" />

        {items.length === 0 ? (
          <p className="text-muted-foreground">
            No articles in this category yet — new guides are on the way.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        <div className="mt-16">
          <Newsletter />
        </div>
      </div>
    </SiteLayout>
  );
}
