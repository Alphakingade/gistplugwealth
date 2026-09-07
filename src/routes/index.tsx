import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard } from "@/components/site/ArticleCard";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { Newsletter } from "@/components/site/Newsletter";
import { WhatsAppCta } from "@/components/site/WhatsAppCta";
import { AdSlot } from "@/components/site/AdSlot";
import { homeQuery, siteQuery } from "@/lib/queries";
import { SITE } from "@/lib/site";
import type { ArticleCard as ArticleCardType, Category } from "@/lib/types";
import heroImage from "@/assets/hero-finance.jpg";

const TITLE = "GistPlugWealth — Make Money & Manage Money in Nigeria";
const DESCRIPTION =
  "Practical Nigerian guides on making money online, side hustles, saving, budgeting, apps and digital business. Inform. Inspire. Increase.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: heroImage, fetchpriority: "high" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(homeQuery()),
      context.queryClient.ensureQueryData(siteQuery()),
    ]);
  },

  component: Index,
});

function Index() {
  const { data: home } = useSuspenseQuery(homeQuery());
  const { data: site } = useSuspenseQuery(siteQuery());

  const featured = (home.featured as unknown as ArticleCardType[]) ?? [];
  const latest = (home.latest as unknown as ArticleCardType[]) ?? [];
  const trending = (home.trending as unknown as ArticleCardType[]) ?? [];
  const categories = (site.categories as unknown as Category[]) ?? [];
  const lead = featured[0] ?? latest[0];
  const secondary = featured.slice(1, 4);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative container-page py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="eyebrow inline-flex items-center gap-2 rounded-full bg-emerald/20 px-3 py-1 text-gold">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {SITE.tagline}
            </span>
            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Practical money moves for everyday Nigerians
            </h1>
            <p className="mt-5 text-lg opacity-90">
              Learn how to make money online, start small businesses, save smarter and use the right
              financial apps — explained in plain language, with real Nigerian context.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/blog"
                className="btn btn-lg btn-gold"
              >
                Start reading <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/category/$slug"
                params={{ slug: "making-money-in-nigeria" }}
                className="btn btn-lg border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Ways to earn
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-12 sm:py-16">
        <AdSlot label="Advertisement" size="leaderboard" className="mb-12" />

        {lead ? (
          <section aria-labelledby="featured-heading" className="mb-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow text-emerald">Featured</span>
                <h2 id="featured-heading" className="mt-1 text-2xl sm:text-3xl">
                  Editor&apos;s pick
                </h2>
              </div>
              <Link
                to="/blog"
                className="link-arrow hidden shrink-0 sm:inline-flex"
              >
                All articles <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ArticleCard article={lead} size="large" priority />
              </div>
              <div className="space-y-6">
                {secondary.length > 0
                  ? secondary.map((article) => (
                      <ArticleCard key={article.id} article={article} size="compact" />
                    ))
                  : latest
                      .slice(1, 4)
                      .map((article) => (
                        <ArticleCard key={article.id} article={article} size="compact" />
                      ))}
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="categories-heading" className="mb-16">
          <span className="eyebrow text-emerald">Explore</span>
          <h2 id="categories-heading" className="mt-1 text-2xl sm:text-3xl">
            Browse by category
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="group surface hover-lift flex items-start gap-4 p-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <CategoryIcon name={category.icon ?? category.name} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-lg font-semibold group-hover:text-primary">
                    {category.name}
                  </span>
                  {category.description ? (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {category.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
          <section aria-labelledby="latest-heading">
            <span className="eyebrow text-emerald">Fresh</span>
            <h2 id="latest-heading" className="mt-1 text-2xl sm:text-3xl">
              Latest articles
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {latest.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            <div className="mt-8">
              <Link
                to="/blog"
                className="btn btn-outline"
              >
                View all articles <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>

          <aside className="space-y-8">
            {trending.length > 0 ? (
              <section
                aria-labelledby="trending-heading"
                className="surface p-6"
              >
                <span className="eyebrow text-emerald">Trending</span>
                <h2 id="trending-heading" className="mt-1 text-xl">
                  Most read this week
                </h2>
                <ol className="mt-5 space-y-5">
                  {trending.map((article, index) => (
                    <li key={article.id} className="flex gap-3">
                      <span className="font-heading text-2xl font-bold text-border">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Link
                        to="/article/$slug"
                        params={{ slug: article.slug }}
                        className="text-[0.95rem] font-semibold leading-snug hover:text-primary"
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <Newsletter compact />
            <AdSlot label="Advertisement" size="rectangle" />
          </aside>
        </div>

        <div className="mt-16 space-y-10">
          <WhatsAppCta url={site.settings["whatsapp_url"]} />
          <Newsletter />
        </div>
      </div>
    </SiteLayout>
  );
}
