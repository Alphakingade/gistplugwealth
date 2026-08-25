# GistPlugWealth — Nigerian finance publication MVP

A production-ready content platform: public publication + secure admin CMS, backed by Lovable Cloud.

## Brand & design system

- Palette: deep green (primary), emerald (secondary), gold (sparing accent), white, soft grey, charcoal. All as semantic tokens in `src/styles.css` (oklch), no hardcoded colours in components.
- Typography: a strong editorial sans pairing (display headings + highly readable body), generous line height, ~68ch article measure.
- Logo: your supplied file used as-is via the asset pipeline, plus a light/dark-safe header, footer and mobile treatment. Square growth-icon crop becomes the favicon.
- Restrained motion, real whitespace, cards used sparingly — magazine feel, not a box grid.

## Public site

- Global shell: subtle utility bar (date, trending link, socials), main nav (Home, Categories, Make Money, Save Money, Student Finance, Apps, Resources, About, Contact), working search, real mobile drawer, full footer.
- `/` — hero ("Smart Money Tips for Young Nigerians", two CTAs, Nigerian finance visual), 6 category cards with icons, featured block (1 large + 3 small), latest articles grid (6 + load more), trending/popular strip, newsletter, WhatsApp CTA, ad slots.
- `/blog` — all published articles, search box, category filter, load more.
- `/category/$slug` — name, description, featured article, grid, load more.
- `/article/$slug` — breadcrumb, category, title, excerpt, author, date, hero image, readable content (headings/lists/quotes/highlight boxes), ad slots top/mid/bottom, tags, share buttons, related articles, newsletter CTA, financial disclaimer.
- `/search` — query echo, result count, results, friendly empty state.
- `/about`, `/contact` (stored submissions + WhatsApp/email/socials), `/privacy-policy`, `/terms-of-use`, `/disclaimer`.
- Every route gets its own title/description/OG/Twitter metadata; article routes add canonical + Article JSON-LD. Sitemap and robots.txt included.

## Admin (`/admin`, protected)

Email+password login, admin role enforced server-side (separate `user_roles` table, never a column on profiles).

- Dashboard stats: total/published/draft articles, categories, subscribers, messages.
- Articles: create/edit/delete, draft/publish/unpublish, featured + popular/trending toggles, featured image upload, category, tags, excerpt, SEO title/description, auto slug, preview.
- Categories: create/edit/delete/reorder with name, slug, description, icon.
- Tags: create/manage.
- Newsletter list (read-only) and contact messages (read + mark handled).
- Settings: WhatsApp link, social URLs, contact email — editable, no hardcoding.

## Data & security (Lovable Cloud)

Tables: `profiles`, `user_roles`, `categories`, `tags`, `articles`, `article_tags`, `newsletter_subscribers`, `contact_messages`, `site_settings`. Storage bucket for article images.

- RLS: public/anon can read only `status = 'published'` articles, categories, tags and settings. Subscribers and contact messages are insert-only for the public and readable only by admins. All writes require the admin role checked through a security-definer function.
- Admin reads/writes go through authenticated server functions; nothing admin-only reachable from the client.
- No hardcoded credentials or secrets in frontend code.

## Content seeding

Six main categories plus Personal Finance, Investments, AI & Business, Resources are seeded. A small set of clearly-marked starter articles on the listed topics is seeded so every page renders real content — all editable/deletable from admin. No fabricated authors, statistics, testimonials or subscriber counts anywhere.

## Technical notes

TanStack Start file routes; loaders use TanStack Query (`ensureQueryData` + `useSuspenseQuery`). Public reads via a server publishable client; admin mutations via `createServerFn` with `requireSupabaseAuth` and a role check. Admin pages live under `_authenticated/`. Images generated at web-appropriate sizes, lazy-loaded below the fold. Zod validation on every form, both client and server.

## Build order

Design system and shell → homepage → blog/category/article → static pages → database + RLS → auth + admin → search, newsletter, contact → SEO, ads, mobile pass and route-by-route verification.

## Open items you'll fill in later

Real WhatsApp community link, social handles, contact email, and your own article content — all configurable in admin settings rather than invented here.
