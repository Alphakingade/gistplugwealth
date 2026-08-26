import { queryOptions } from "@tanstack/react-query";
import {
  getArticle,
  getCategory,
  getHomeData,
  getSiteData,
  listArticles,
} from "./content.functions";

export const siteQuery = () =>
  queryOptions({
    queryKey: ["site-data"],
    queryFn: () => getSiteData(),
    staleTime: 5 * 60 * 1000,
  });

export const homeQuery = () =>
  queryOptions({
    queryKey: ["home-data"],
    queryFn: () => getHomeData(),
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
  });

export const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article", slug],
    queryFn: () => getArticle({ data: { slug } }),
  });

export const categoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => getCategory({ data: { slug } }),
  });
