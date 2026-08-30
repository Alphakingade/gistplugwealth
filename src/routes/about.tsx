import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, HandCoins, ShieldCheck, Target } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Newsletter } from "@/components/site/Newsletter";
import { SITE } from "@/lib/site";

const TITLE = "About GistPlugWealth — Our Money Mission";
const DESCRIPTION =
  "GistPlugWealth exists to help Nigerians understand money, discover legitimate income opportunities and build lasting financial confidence.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  {
    icon: Target,
    title: "Practical over theoretical",
    body: "Every guide is written so you can act on it today — with steps, tools and Nigerian context.",
  },
  {
    icon: ShieldCheck,
    title: "Honest and scam-aware",
    body: "We flag risks clearly and never promote get-rich-quick schemes or unverified platforms.",
  },
  {
    icon: HandCoins,
    title: "Money that works locally",
    body: "Naira realities, local banks, local apps, local hustles — advice that fits how you actually earn.",
  },
  {
    icon: Compass,
    title: "Plain language",
    body: "No jargon walls. If a term matters, we explain it simply before we use it.",
  },
];

function AboutPage() {
  return (
    <SiteLayout>
      <div className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-page py-16">
          <span className="eyebrow text-gold">About us</span>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">
            Helping Nigerians inform, inspire and increase their income
          </h1>
          <p className="mt-5 max-w-2xl text-lg opacity-90">{DESCRIPTION}</p>
        </div>
      </div>

      <div className="container-page py-14">
        <div className="grid gap-12 lg:grid-cols-[2fr,1fr]">
          <div className="prose-article">
            <h2>Why {SITE.name} exists</h2>
            <p>
              Money information in Nigeria is either too academic, too foreign, or too good to be
              true. Many people looking for a genuine side hustle end up in a WhatsApp group
              promising 50% returns in a week. We built {SITE.name} as the calmer alternative: a
              publication that treats readers like adults and explains money the way a knowledgeable
              friend would.
            </p>

            <h2>What we cover</h2>
            <p>
              Making money online, side hustles and small business ideas, saving and budgeting on a
              Nigerian salary, useful fintech and productivity apps, student finance, and the
              digital skills that increasingly decide who earns more.
            </p>

            <h2>How we work</h2>
            <p>
              Guides are researched, tested where possible, and updated as platforms change. When we
              recommend a tool we say what it costs, who it fits and where it falls short. When
              something carries risk, we say so plainly instead of burying it in a footnote.
            </p>

            <h2>Editorial independence</h2>
            <p>
              Some pages carry adverts or affiliate links, which help keep the publication free. They
              never determine our verdicts, and sponsored content is always labelled.
            </p>
          </div>

          <aside className="space-y-4">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="surface hover-lift p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <value.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-3 font-heading text-lg font-semibold">{value.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{value.body}</p>
              </div>
            ))}
            <Link
              to="/contact"
              className="btn btn-primary btn-block"
            >
              Work with us
            </Link>
          </aside>
        </div>

        <div className="mt-16">
          <Newsletter />
        </div>
      </div>
    </SiteLayout>
  );
}
