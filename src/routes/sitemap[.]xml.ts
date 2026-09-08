import { createFileRoute } from "@tanstack/react-router";
import { listAllPublishedSlugs } from "@/lib/content.functions";

const STATIC_PATHS = [
  "/",
  "/blog",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-use",
  "/disclaimer",
];

const BASE_URL = "https://gistplugwealth-demo1.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = BASE_URL;
        const { articles, categories } = await listAllPublishedSlugs();

        const urls = [
          ...STATIC_PATHS.map((path) => ({ loc: `${origin}${path}`, lastmod: undefined })),
          ...categories.map((category: { slug: string }) => ({
            loc: `${origin}/category/${category.slug}`,
            lastmod: undefined,
          })),
          ...articles.map((article: { slug: string; updated_at: string | null }) => ({
            loc: `${origin}/article/${article.slug}`,
            lastmod: article.updated_at ?? undefined,
          })),
        ];

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `  <url><loc>${url.loc}</loc>${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
