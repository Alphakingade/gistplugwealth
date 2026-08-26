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
              <Link to="/" className="opacity-85 hover:opacity-100 hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link to="/blog" className="opacity-85 hover:opacity-100 hover:underline">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/about" className="opacity-85 hover:opacity-100 hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="opacity-85 hover:opacity-100 hover:underline">
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
                  className="opacity-85 hover:opacity-100 hover:underline"
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
              <Link to="/privacy-policy" className="opacity-85 hover:opacity-100 hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms-of-use" className="opacity-85 hover:opacity-100 hover:underline">
                Terms of Use
              </Link>
            </li>
            <li>
              <Link to="/disclaimer" className="opacity-85 hover:opacity-100 hover:underline">
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
                      className="opacity-85 hover:opacity-100 hover:underline"
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
