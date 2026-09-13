# GistPlugWealth roadmap

- [x] Public site (home, blog, category, article, search, static pages)
- [x] Admin CMS (articles, taxonomy, inbox, settings, team)
- [x] Article management: publish/unpublish, filters, search, live view, delete
- [x] Category reordering + tag management
- [x] Newsletter list with CSV export, contact inbox with handled status
- [x] Simplified WhatsApp-style formatting + sitewide UI/motion rework
- [x] Sitewide speed optimisation
- [x] Mobile pass: all routes checked at 390px, no overflow, no console errors
- [x] Fixed blank-then-pop flash on home/blog/category (data now ready before render)
- [x] Search page: on-page search box + friendly no-results state
- [ ] Vercel deployment errors (paused at user's request)


## Static hosting (QServers cPanel) + production fixes
- [x] Browser-only data layer (no server functions)
- [x] Direct public storage image URLs + storage RLS policies
- [x] STATIC_BUILD vite config, finalize-static.mjs, .htaccess SPA fallback
- [x] GitHub Actions FTP deploy workflow
- [x] Google OAuth PKCE code exchange on /auth (custom domain)
- [x] Direct File/Blob image upload with real error messages
- [x] Article save/publish + article_tags errors surfaced
- [ ] Admin allowlist trigger (dadebimpe46@, gistplugwealth@) + backfill
- [x] DEPLOY.md and README.md rewrite
