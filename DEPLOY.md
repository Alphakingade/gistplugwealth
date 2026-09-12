# Deploying GistPlugWealth to shared cPanel hosting (QServers)

The site is built as a **browser-only static site**. There is no Node process,
no SSH and no server code on the host — Apache just serves files, and the pages
talk to the Lovable Cloud backend directly from the visitor's browser.

Live site: https://gistplugwealth.com.ng

---

## Option A — automatic deploys with GitHub Actions (recommended)

Every push to `main` builds the site and uploads it to your hosting over FTP.

### 1. Add the GitHub secrets

In your repository: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
| --- | --- |
| `SITE_URL` | `https://gistplugwealth.com.ng` |
| `VITE_SUPABASE_URL` | Backend URL (from the project's `.env`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (from `.env`) |
| `VITE_SUPABASE_PROJECT_ID` | Project id (from `.env`) |
| `FTP_SERVER` | e.g. `ftp.gistplugwealth.com.ng` or the server hostname |
| `FTP_USERNAME` | The FTP account user |
| `FTP_PASSWORD` | The FTP account password |
| `FTP_SERVER_DIR` | `/public_html/` (include the trailing slash) |

### 2. Where the FTP details come from in cPanel

1. Log in to cPanel (QServers).
2. Open **Files → FTP Accounts**.
3. Create an account (or use an existing one) pointed at `public_html`.
4. Click **Configure FTP Client** next to the account — it lists the **FTP
   server** and **FTP username** exactly as they must be entered above.
5. The password is whatever you set when creating the account.

### 3. Deploy

Push to `main`, or run the workflow manually: **Actions → Deploy static site to
cPanel → Run workflow**. The workflow is at
`.github/workflows/deploy-static.yml`.

It never wipes the remote folder (`dangerous-clean-slate: false`), so anything
else you keep in `public_html` stays put.

---

## Option B — manual upload

```bash
npm install
npm run build:static
```

This produces a `dist-static/` folder. Upload **the contents** of
`dist-static/` (not the folder itself) into `public_html` using cPanel's File
Manager or any FTP client. Include the hidden `.htaccess` file — in File
Manager, turn on **Settings → Show Hidden Files** first.

---

## What's in the build

| File | Why it matters |
| --- | --- |
| `index.html` / `404.html` | The app shell |
| `.htaccess` | Sends `/blog`, `/article/…`, `/admin`, `/auth` etc. to the app, keeps real files working, enables compression and long-term caching |
| `assets/…` | Fingerprinted JavaScript, CSS and images |
| `sitemap.xml` | Generated at build time from live published articles and categories |
| `robots.txt` | Points crawlers at the sitemap; hides `/admin` and `/auth` |
| `favicon.png`, `llms.txt` | Site icon and the AI-assistant guide |

---

## Admin access

- The dashboard is always at `https://gistplugwealth.com.ng/admin`.
- Sign in at `https://gistplugwealth.com.ng/auth`.
- `dadebimpe46@gmail.com` and `gistplugwealth@gmail.com` are granted admin
  automatically the moment they sign up (or confirm their email) — just create
  the account at `/auth` and you're in.
- Existing admins can add or remove other admins from **Admin → Admin team**.

---

## Backend settings to check once

In the Lovable Cloud backend → Authentication settings:

- **Site URL**: `https://gistplugwealth.com.ng`
- **Redirect URLs**: add `https://gistplugwealth.com.ng/auth` and
  `https://gistplugwealth.com.ng/**`
- **Google sign-in**: make sure the Google provider is enabled, otherwise the
  "Continue with Google" button returns an "unsupported provider" error.

Without these, Google sign-in bounces back to the old address.

---

## Trade-off to be aware of

Pages are rendered in the visitor's browser, so when a link is shared on
WhatsApp, X or Facebook the preview shows the general site title, description
and image — not the specific article's own title and cover. Search engines that
run JavaScript (Google) still index the article content normally, and the
sitemap lists every published article.

---

## Other hosts

The normal server build (`npm run build`) is untouched and still works for
platforms that can run Node/edge servers (Vercel, Cloudflare). Static hosting
does not replace it — it is a separate output.
