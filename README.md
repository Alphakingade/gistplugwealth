# GistPlugWealth

**Inform. Inspire. Increase.**

GistPlugWealth is a Nigerian digital finance and opportunity publication. It
publishes plain-language guides on making money in Nigeria, saving money, side
hustles, student finance, money apps and online business — written for
students, employees, entrepreneurs and business owners.

Live site: https://gistplugwealth.com.ng

---

## What the site includes

**Public publication**

- Home page with featured, latest and trending stories
- Category pages (Make Money, Save Money, Student Finance, Apps, Resources…)
- Full article pages with reading progress, related stories and sharing
- Search across every published guide
- Newsletter sign-up and a contact form
- About, Privacy Policy, Terms of Use and financial Disclaimer pages
- Sitemap, robots rules, social share tags and an `llms.txt` guide for AI
  assistants

**Admin dashboard** (`/admin`)

- Dashboard with content and audience counts
- Article editor with WhatsApp-style formatting (`*bold*`, `_italic_`,
  `~strike~`, `!! tip`), live preview and cover-image upload
- One-click publish / unpublish, draft filtering and title search
- Categories and tags, including category ordering
- Inbox for contact messages, plus newsletter subscriber export (CSV)
- Site settings (WhatsApp community link, contact email, social links)
- Admin team management — existing admins can grant or revoke access

---

## How it's built

| Layer | Technology |
| --- | --- |
| App | React 19 + TanStack Router / Start, Vite |
| Styling | Tailwind CSS v4 with a deep-green, emerald and gold design system |
| Data | Lovable Cloud (Postgres, Auth, Storage) accessed from the browser |
| Security | Row level security on every table; admin role stored separately |

Content is read with the public key under row-level security, so the published
site needs no server. Admin actions require a signed-in account holding the
`admin` role, enforced in the database rather than in the browser.

---

## Local development

```bash
npm install
npm run dev
```

The app runs at http://localhost:8080.

---

## Builds

```bash
npm run build          # normal server build (Vercel, Cloudflare, etc.)
npm run build:static   # browser-only build → dist-static/ for shared hosting
```

`npm run build:static` writes a `dist-static/` folder containing the app shell,
an Apache `.htaccess`, a freshly generated `sitemap.xml` and `robots.txt` — the
exact contents to drop into `public_html` on cPanel.

---

## Deployment

Production runs on shared cPanel hosting (QServers) and is deployed
automatically by GitHub Actions over FTP on every push to `main`.

See **[DEPLOY.md](./DEPLOY.md)** for the required GitHub secrets, where to find
your FTP details in cPanel, the manual upload alternative and the backend
authentication settings to confirm.

---


## Disclaimer

Everything published on GistPlugWealth is educational information about money
in Nigeria. It is not financial advice.
