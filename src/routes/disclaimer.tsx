import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SITE } from "@/lib/site";

const TITLE = "Disclaimer — GistPlugWealth";
const DESCRIPTION =
  "GistPlugWealth publishes educational money content. This disclaimer explains the limits of that information and your responsibility as a reader.";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <SiteLayout>
      <div className="container-page max-w-3xl py-14">
        <span className="eyebrow text-emerald">Legal</span>
        <h1 className="mt-2 text-3xl sm:text-4xl">Disclaimer</h1>
        <div className="prose-article mt-8">
          <h2>Educational information only</h2>
          <p>
            Everything published on {SITE.name} is for general education and information. It is not
            personalised financial, investment, tax or legal advice, and should not be treated as a
            recommendation to buy, sell or join any product, platform or scheme.
          </p>

          <h2>No guaranteed results</h2>
          <p>
            Income examples, side hustle earnings and app payouts vary widely. Results depend on
            your skills, effort, market conditions and factors outside our control. We do not
            guarantee that you will earn any specific amount.
          </p>

          <h2>Do your own research</h2>
          <p>
            Platforms change fees, rules and availability without notice. Always confirm current
            details directly with the provider, and be extremely cautious with anything promising
            unusually high or fixed returns.
          </p>

          <h2>Third parties</h2>
          <p>
            We are not affiliated with the banks, fintechs or platforms we write about unless
            explicitly stated. We are not liable for losses arising from decisions you make based on
            our content.
          </p>

          <h2>Questions</h2>
          <p>
            If you believe something we published is inaccurate or out of date, please contact us so
            we can review and correct it.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
