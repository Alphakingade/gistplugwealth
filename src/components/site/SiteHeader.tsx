import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, TrendingUp, X } from "lucide-react";
import { Logo } from "./Logo";
import { MAIN_NAV, SOCIAL_KEYS } from "@/lib/site";
import { siteQuery, homeQuery } from "@/lib/queries";

function SearchForm({ onDone, id }: { onDone?: () => void; id: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = value.trim();
    if (!q) return;
    onDone?.();
    navigate({ to: "/search", search: { q } });
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Search articles
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search articles"
        className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  );
}

export function SiteHeader() {
  const { data: site } = useQuery(siteQuery());
  const { data: home } = useQuery(homeQuery());
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  const settings = site?.settings ?? {};
  const socials = SOCIAL_KEYS.filter((item) => settings[item.key]);
  const trending = home?.trending?.[0];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="hidden border-b border-border bg-primary text-primary-foreground lg:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <span className="opacity-80">{today}</span>
          {trending ? (
            <p className="flex min-w-0 items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <span className="eyebrow text-gold">Trending</span>
              <Link
                to="/article/$slug"
                params={{ slug: trending.slug }}
                className="truncate hover:underline"
              >
                {trending.title}
              </Link>
            </p>
          ) : (
            <span className="opacity-80">Inform. Inspire. Increase.</span>
          )}
          <div className="flex items-center gap-4">
            {socials.map((item) => (
              <a
                key={item.key}
                href={settings[item.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        <Logo />

        <div className="hidden max-w-xs flex-1 lg:block">
          <SearchForm id="search-desktop" />
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <nav aria-label="Main" className="hidden border-t border-border lg:block">
        <div className="container-page flex h-12 items-center gap-6 overflow-x-auto text-sm font-semibold">
          {MAIN_NAV.map((item) =>
            "slug" in item ? (
              <Link
                key={item.label}
                to="/category/$slug"
                params={{ slug: item.slug }}
                className="whitespace-nowrap text-foreground/80 transition-colors hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="whitespace-nowrap text-foreground/80 transition-colors hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-border bg-background lg:hidden">
          <div className="container-page space-y-4 py-4">
            <SearchForm id="search-mobile" onDone={() => setOpen(false)} />
            <nav aria-label="Mobile" className="grid gap-1">
              {MAIN_NAV.map((item) =>
                "slug" in item ? (
                  <Link
                    key={item.label}
                    to="/category/$slug"
                    params={{ slug: item.slug }}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 font-semibold text-foreground/85 hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 font-semibold text-foreground/85 hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
            {socials.length > 0 ? (
              <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
                {socials.map((item) => (
                  <a
                    key={item.key}
                    href={settings[item.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
