import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertTriangle, Clock, UserRound } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleBody } from "@/components/site/ArticleBody";
import { ArticleCard } from "@/components/site/ArticleCard";
import { Newsletter } from "@/components/site/Newsletter";
import { AdSlot } from "@/components/site/AdSlot";
import { coverFor } from "@/components/site/covers";
import { articleQuery } from "@/lib/queries";
import { SITE, formatDate } from "@/lib/site";
import type { ArticleCard as ArticleCardType, ArticleFull } from "@/lib/types";

type LoadedArticle = { article: ArticleFull; related: ArticleCardType[] };

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ context, params }) => {
    const result = (await context.queryClient.ensureQueryData(
      articleQuery(params.slug),
    )) as LoadedArticle | null;
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article not found" }, { name: "robots", content: "noindex" }] };
    }
    const { article } = loaderData;
    const title = article.seo_title ?? `${article.title} | ${SITE.name}`;
    const description =
      article.seo_description ?? article.excerpt ?? `${article.title} — a ${SITE.name} guide.`;
    const image = article.featured_image?.startsWith("http") ? article.featured_image : null;
    const url = `${SITE.publicUrl}/article/${params.slug}`;
    const published = article.published_at ?? article.created_at;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "article:published_time", content: published },
        { property: "article:author", content: article.author_name },
        ...(article.category ? [{ property: "article:section", content: article.category.name }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                mainEntityOfPage: { "@type": "WebPage", "@id": url },
                headline: article.title,
                description: article.excerpt ?? description,
                datePublished: published,
                dateModified: article.updated_at ?? published,
                inLanguage: "en-NG",
                author: { "@type": "Person", name: article.author_name },
                publisher: {
                  "@type": "Organization",
                  name: SITE.name,
                  url: SITE.publicUrl,
                  logo: {
                    "@type": "ImageObject",
                    url: `${SITE.publicUrl}/favicon.png`,
                  },
                },
                ...(article.category ? { articleSection: article.category.name } : {}),
                ...(image ? { image: [image] } : {}),
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE.publicUrl },
                  ...(article.category
                    ? [
                        {
                          "@type": "ListItem",
                          position: 2,
                          name: article.category.name,
                          item: `${SITE.publicUrl}/category/${article.category.slug}`,
                        },
                      ]
                    : []),
                  {
                    "@type": "ListItem",
                    position: article.category ? 3 : 2,
                    name: article.title,
                    item: url,
                  },
                ],
              },
            ],
          }),
        },
      ],
    };
  },

  notFoundComponent: ArticleNotFound,
  component: ArticlePage,
});

function ArticleNotFound() {
  return (
    <SiteLayout>
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl">Article not found</h1>
        <p className="mt-3 text-muted-foreground">
          This article may have been moved or unpublished.
        </p>
        <Link
          to="/blog"
          className="btn btn-primary mt-6"
        >
          Browse articles
        </Link>
      </div>
    </SiteLayout>
  );
}

function ArticlePage() {
  const { article, related } = Route.useLoaderData();
  const cover = coverFor(article);
  const published = article.published_at ?? article.created_at;




  return (
    <SiteLayout>
      <article>
        <header className="border-b border-border bg-primary-soft">
          <div className="container-page py-10 sm:py-14">
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
              <span className="px-2">/</span>
              {article.category ? (
                <>
                  <Link
                    to="/category/$slug"
                    params={{ slug: article.category.slug }}
                    className="hover:text-primary"
                  >
                    {article.category.name}
                  </Link>
                  <span className="px-2">/</span>
                </>
              ) : null}
              <span className="text-foreground">{article.title}</span>
            </nav>

            <h1 className="mt-5 max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {article.title}
            </h1>

            {article.excerpt ? (
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{article.excerpt}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {article.author_name}
              </span>
              <time dateTime={published}>{formatDate(published)}</time>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {article.read_minutes} min read
              </span>
            </div>
          </div>
        </header>

        <div className="container-page py-10 lg:py-14">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr),320px]">
            <div className="min-w-0">
              <img
                src={cover}
                alt={article.title}
                width={1200}
                height={800}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="aspect-[3/2] w-full rounded-xl object-cover shadow-card"
              />

              <AdSlot size="inline" className="my-8" />

              <ArticleBody content={article.content} />

              {article.tags.length > 0 ? (
                <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              ) : null}

              <aside className="mt-10 flex gap-3 rounded-xl border border-border bg-muted/60 p-5 text-sm text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                <p>
                  <strong className="text-foreground">Disclaimer:</strong> This article is for
                  educational and informational purposes only and is not personalised financial
                  advice. Always do your own research and confirm platform details before investing
                  money or sharing personal information.
                </p>
              </aside>

              <div className="mt-10">
                <Newsletter compact />
              </div>
            </div>

            <aside className="space-y-8">
              <AdSlot size="rectangle" />
              {related.length > 0 ? (
                <section
                  aria-labelledby="related-heading"
                  className="surface p-6"
                >
                  <span className="eyebrow text-emerald">Keep reading</span>
                  <h2 id="related-heading" className="mt-1 text-xl">
                    Related articles
                  </h2>
                  <div className="mt-5 space-y-5">
                    {related.map((item) => (
                      <ArticleCard key={item.id} article={item} size="compact" />
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      </article>

      
    </SiteLayout>
  );
}
