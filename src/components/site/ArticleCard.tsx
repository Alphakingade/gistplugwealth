import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { coverFor } from "./covers";
import { formatDate } from "@/lib/site";
import type { ArticleCard as ArticleCardType } from "@/lib/types";

export function ArticleCard({
  article,
  size = "default",
  priority = false,
}: {
  article: ArticleCardType;
  size?: "default" | "large" | "compact";
  /** Set on the first above-the-fold card so its image is fetched immediately. */
  priority?: boolean;
}) {
  const cover = coverFor(article);

  if (size === "compact") {
    return (
      <article className="group flex gap-4 rounded-xl p-1 transition-colors hover:bg-muted/60">
        <Link
          to="/article/$slug"
          params={{ slug: article.slug }}
          className="shrink-0 overflow-hidden rounded-xl"
        >
          <img
            src={cover}
            alt={article.title}
            width={160}
            height={120}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-20 w-24 object-cover transition-transform duration-500 group-hover:scale-110 sm:w-28"
          />
        </Link>
        <div className="min-w-0">
          {article.category ? (
            <Link
              to="/category/$slug"
              params={{ slug: article.category.slug }}
              className="eyebrow text-emerald hover:underline"
            >
              {article.category.name}
            </Link>
          ) : null}
          <h3 className="mt-1 text-base leading-snug">
            <Link
              to="/article/$slug"
              params={{ slug: article.slug }}
              className="transition-colors hover:text-primary"
            >
              {article.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(article.published_at ?? article.created_at)}
          </p>
        </div>
      </article>
    );
  }

  const isLarge = size === "large";

  return (
    <article
      className={`group surface hover-lift flex h-full flex-col overflow-hidden ${
        isLarge ? "lg:flex-row" : ""
      }`}
    >
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className={`block overflow-hidden ${isLarge ? "lg:w-1/2" : ""}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={cover}
          alt=""
          width={1200}
          height={800}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
            isLarge ? "h-56 lg:h-full" : "h-48"
          }`}
        />
      </Link>

      <div className={`flex flex-1 flex-col p-5 ${isLarge ? "lg:justify-center lg:p-8" : ""}`}>
        <div className="flex items-center gap-3 text-xs">
          {article.category ? (
            <Link
              to="/category/$slug"
              params={{ slug: article.category.slug }}
              className="chip chip-brand"
            >
              {article.category.name}
            </Link>
          ) : null}
          <span className="text-muted-foreground">{article.read_minutes} min read</span>
        </div>

        <h3 className={`mt-3 ${isLarge ? "text-2xl sm:text-3xl" : "text-xl"}`}>
          <Link
            to="/article/$slug"
            params={{ slug: article.slug }}
            className="bg-gradient-to-r from-emerald to-emerald bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size,color] duration-300 hover:bg-[length:100%_2px] hover:text-primary"
          >
            {article.title}
          </Link>
        </h3>

        {article.excerpt ? (
          <p
            className={`mt-2 text-muted-foreground ${isLarge ? "text-base" : "text-[0.95rem] line-clamp-3"}`}
          >
            {article.excerpt}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
          <span>
            {article.author_name} · {formatDate(article.published_at ?? article.created_at)}
          </span>
          <Link
            to="/article/$slug"
            params={{ slug: article.slug }}
            className="link-arrow"
          >
            Read article <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
