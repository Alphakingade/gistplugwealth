import { queryOptions } from "@tanstack/react-query";
import {
  getArticle,
  getCategory,
  getHomeData,
  getSiteData,
  listArticles,
} from "./content.functions";

// Published content changes rarely — keep it warm in memory so repeat
// navigation is instant instead of refetching on every route change.
const FRESH = 5 * 60 * 1000;
const KEEP = 30 * 60 * 1000;

export const siteQuery = () =>
  queryOptions({
    queryKey: ["site-data"],
    queryFn: () => getSiteData(),
    staleTime: FRESH,
    gcTime: KEEP,
  });

export const homeQuery = () =>
  queryOptions({
    queryKey: ["home-data"],
    queryFn: () => getHomeData(),
    staleTime: FRESH,
    gcTime: KEEP,
  });

export const articlesQuery = (params: {
  categorySlug?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) =>
  queryOptions({
    queryKey: ["articles", params],
    queryFn: () =>
      listArticles({
        data: {
          categorySlug: params.categorySlug,
          q: params.q,
          limit: params.limit ?? 9,
          offset: params.offset ?? 0,
        },
      }),
    staleTime: FRESH,
    gcTime: KEEP,
  });

export const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article", slug],
    queryFn: () => getArticle({ data: { slug } }),
    staleTime: FRESH,
    gcTime: KEEP,
  });

export const categoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => getCategory({ data: { slug } }),
    staleTime: FRESH,
    gcTime: KEEP,
  });
