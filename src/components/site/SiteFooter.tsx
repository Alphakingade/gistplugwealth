import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "./Logo";
import { SITE, SOCIAL_KEYS } from "@/lib/site";
import { siteQuery } from "@/lib/queries";

export function SiteFooter() {
  const { data: site } = useQuery(siteQuery());
  const settings = site?.settings ?? {};
  const categories = (site?.categories ?? []).slice(0, 6);
  const socials = SOCIAL_KEYS.filter((item) => settings[item.key]);

  return (
    <footer className="mt-20 border-t border-border bg-primary text-primary-foreground">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="rounded-md bg-background p-3 inline-block">
            <Logo />
          </div>
          <p className="mt-4 text-sm opacity-85">
            {SITE.name} helps Nigerians understand money, discover legitimate ways to earn and grow
            their finances — one practical guide at a time.
          </p>
          <p className="eyebrow mt-4 text-gold">{SITE.tagline}</p>
        </div>

        <nav aria-label="Quick links">
          <h2 className="eyebrow text-gold">Quick Links</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/" className="inline-block opacity-85 transition-all hover:translate-x-1 hover:text-gold hover:opacity-100">
                Home
              </Link>
            </li>
            <li>
              <Link to="/blog" className="inline-block opacity-85 transition-all hover:translate-x-1 hover:text-gold hover:opacity-100">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/about" className="inline-block opacity-85 transition-all hover:translate-x-1 hover:text-gold hover:opacity-100">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="inline-block opacity-85 transition-all hover:translate-x-1 hover:text-gold hover:opacity-100">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Categories">
          <h2 className="eyebrow text-gold">Categories</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  to="/category/$slug"
                  params={{ slug: category.slug }}
                  className="inline-block opacity-85 transition-all hover:translate-x-1 hover:text-gold hover:opacity-100"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow text-gold">Legal</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/privacy-policy" className="inline-block opacity-85 transition-all hover:translate-x-1 hover:text-gold hover:opacity-100">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms-of-use" className="inline-block opacity-85 transition-all hover:translate-x-1 hover:text-gold hover:opacity-100">
                Terms of Use
              </Link>
            </li>
            <li>
              <Link to="/disclaimer" className="inline-block opacity-85 transition-all hover:translate-x-1 hover:text-gold hover:opacity-100">
                Disclaimer
              </Link>
            </li>
          </ul>

          {socials.length > 0 ? (
            <>
              <h2 className="eyebrow mt-8 text-gold">Follow</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {socials.map((item) => (
                  <li key={item.key}>
                    <a
                      href={settings[item.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block opacity-85 transition-all hover:translate-x-1 hover:text-gold hover:opacity-100"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="container-page flex flex-col gap-2 py-6 text-xs opacity-80 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p>Educational information only — not personalised financial advice.</p>
        </div>
      </div>
    </footer>
  );
}
