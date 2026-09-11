/**
 * Image URL helpers.
 *
 * On static hosting there is no server, so stored images are read straight
 * from the public storage bucket instead of being streamed through an app
 * route.
 */

const BUCKET = "article-images";

function storageBase() {
  const url =
    (typeof import.meta !== "undefined" ? import.meta.env?.["VITE_SUPABASE_URL"] : undefined) ??
    (typeof process !== "undefined" ? process.env?.["SUPABASE_URL"] : undefined) ??
    "";
  return String(url).replace(/\/+$/, "");
}

/** Direct public URL for a path inside the article images bucket. */
export function publicImageUrl(path: string) {
  const clean = String(path).replace(/^\/+/, "");
  return `${storageBase()}/storage/v1/object/public/${BUCKET}/${clean}`;
}

/**
 * Accepts anything stored on an article/category and returns something the
 * browser can load: legacy `/api/public/media/<path>` URLs are rewritten to
 * the direct public storage URL; everything else is passed through.
 */
export function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const legacy = url.match(/\/api\/(?:public\/)?media\/(.+)$/);
  if (legacy?.[1]) return publicImageUrl(legacy[1]);
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("/")) return url;
  return publicImageUrl(url);
}
