# Deploying GistPlugWealth to Vercel

This is a TanStack Start app with server-side rendering, so it must be deployed
as a **server** app, not as a static Vite site.

## 1. Import the repo on Vercel

Vercel reads `vercel.json` in the repo root, which already sets:

- Framework preset: **Other** (`"framework": null`) — do not leave it on "Vite",
  that would publish an empty static folder and every page would 404.
- Build command: `vite build`
- `NITRO_PRESET=vercel` so the SSR server is emitted to `.vercel/output`
  (Vercel Build Output API). Leave "Output Directory" **empty** in the Vercel UI.

## 2. Environment variables

The backend URL and publishable key are baked into the build from the repo's
`.env`, and the server falls back to those values when the matching
`SUPABASE_*` variables are missing, so sign in / sign up work on Vercel without
extra setup. Setting them explicitly still overrides the defaults.


Add these in Vercel → Project → Settings → Environment Variables
(Production **and** Preview). Values are the ones in your project's `.env`:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Browser backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Project id |
| `SUPABASE_URL` | Same URL, for server functions |
| `SUPABASE_PUBLISHABLE_KEY` | Same publishable key, for server functions |
| `SUPABASE_PROJECT_ID` | Project id |
| `SUPABASE_SERVICE_ROLE_KEY` | Only needed for serving uploaded article images |

`VITE_*` values are inlined at build time — after changing them, redeploy.

## 3. Auth redirect URLs

In the backend auth settings add your new domain to the allowed redirect URLs
and set the Site URL to `https://your-domain.com`, otherwise Google sign-in
bounces back to the old domain.

## 4. Admin access

The admin dashboard always lives at `https://your-domain.com/admin`.
Sign in at `/auth` with an account that has the admin role; existing admins can
grant access to new emails from **Admin → Admin team**.
