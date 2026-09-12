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
- [ ] Browser-only data layer (no server functions)
- [ ] Direct public storage image URLs + storage RLS policies
- [ ] STATIC_BUILD vite config, finalize-static.mjs, .htaccess SPA fallback
- [ ] GitHub Actions FTP deploy workflow
- [ ] Google OAuth PKCE code exchange on /auth (custom domain)
- [ ] Direct File/Blob image upload with real error messages
- [ ] Article save/publish + article_tags errors surfaced
- [ ] Admin allowlist trigger (dadebimpe46@, gistplugwealth@) + backfill
- [ ] DEPLOY.md and README.md rewrite
