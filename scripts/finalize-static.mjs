/**
 * Post-build step for static (browser-only) hosting.
 *
 * Takes the client bundle Vite produced and turns it into a folder that can be
 * dropped straight into cPanel's public_html:
 *   - dist-static/index.html + 404.html  (the app shell)
 *   - .htaccess with SPA fallback, gzip and long-lived asset caching
 *   - sitemap.xml + robots.txt generated from live published content
 */
import { cp, mkdir, readFile, writeFile, rm, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const clientDir = path.join(root, "dist", "client");
const outDir = path.join(root, "dist-static");

/** Reads .env by hand so local builds work without CI variables. */
async function envFromDotEnv() {
  const out = {};
  try {
    const raw = await readFile(path.join(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env — CI supplies the values */
  }
  return out;
}

const exists = async (p) => access(p).then(() => true).catch(() => false);

async function main() {
  if (!(await exists(clientDir))) {
    throw new Error(`Missing ${clientDir}. Run the static build first.`);
  }

  const dotenv = await envFromDotEnv();
  const pick = (name) => process.env[name] || dotenv[name] || "";

  const siteUrl = (pick("SITE_URL") || "https://gistplugwealth.com.ng").replace(/\/+$/, "");
  const supabaseUrl = (pick("VITE_SUPABASE_URL") || pick("SUPABASE_URL")).replace(/\/+$/, "");
  const supabaseKey =
    pick("VITE_SUPABASE_PUBLISHABLE_KEY") || pick("SUPABASE_PUBLISHABLE_KEY");

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await cp(clientDir, outDir, { recursive: true });

  // The SPA shell Vite emits.
  const shellCandidates = ["_shell.html", "index.html", "__root.html"];
  let shell = null;
  for (const name of shellCandidates) {
    const file = path.join(outDir, name);
    if (await exists(file)) {
      shell = await readFile(file, "utf8");
      break;
    }
  }
  if (!shell) throw new Error("Could not find the built app shell (_shell.html).");

  await writeFile(path.join(outDir, "index.html"), shell);
  await writeFile(path.join(outDir, "404.html"), shell);

  await writeFile(
    path.join(outDir, ".htaccess"),
    `# GistPlugWealth — static hosting (Apache / cPanel)
Options -MultiViews
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  # Serve real files and folders as-is; everything else is handled by the app.
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/xml
  AddOutputFilterByType DEFLATE application/javascript application/json
  AddOutputFilterByType DEFLATE application/xml image/svg+xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Fingerprinted assets never change — cache them hard.
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|woff2?|png|jpe?g|webp|avif|svg|gif|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(html)$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
</IfModule>

ErrorDocument 404 /index.html
`,
  );

  // --- sitemap + robots -----------------------------------------------------
  const staticPaths = [
    "/",
    "/blog",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms-of-use",
    "/disclaimer",
  ];

  async function restSelect(table, query) {
    if (!supabaseUrl || !supabaseKey) return [];
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        headers: { apikey: supabaseKey },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  const [articles, categories] = await Promise.all([
    restSelect(
      "articles",
      "select=slug,updated_at&status=eq.published&order=published_at.desc&limit=500",
    ),
    restSelect("categories", "select=slug&order=sort_order.asc"),
  ]);

  const entries = [
    ...staticPaths.map((p) => ({ loc: `${siteUrl}${p}` })),
    ...categories.map((c) => ({ loc: `${siteUrl}/category/${c.slug}` })),
    ...articles.map((a) => ({
      loc: `${siteUrl}/article/${a.slug}`,
      lastmod: a.updated_at ?? undefined,
    })),
  ];

  await writeFile(
    path.join(outDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>
`,
  );

  await writeFile(
    path.join(outDir, "robots.txt"),
    `User-agent: *
Allow: /
Disallow: /admin
Disallow: /auth

Sitemap: ${siteUrl}/sitemap.xml
`,
  );

  console.log(
    `finalize-static: dist-static ready — ${articles.length} articles, ${categories.length} categories in sitemap (${siteUrl})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
