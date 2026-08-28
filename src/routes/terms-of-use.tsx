import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SITE } from "@/lib/site";

const TITLE = "Terms of Use — GistPlugWealth";
const DESCRIPTION =
  "The terms that govern your use of the GistPlugWealth website, its content, newsletter and community channels.";

export const Route = createFileRoute("/terms-of-use")({
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
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteLayout>
      <div className="container-page max-w-3xl py-14">
        <span className="eyebrow text-emerald">Legal</span>
        <h1 className="mt-2 text-3xl sm:text-4xl">Terms of Use</h1>
        <div className="prose-article mt-8">
          <p>
            By accessing {SITE.name} you agree to these terms. If you do not agree, please stop
            using the site.
          </p>

          <h2>Use of content</h2>
          <p>
            All articles, graphics and branding on this site belong to {SITE.name} unless stated
            otherwise. You may share short excerpts with clear attribution and a link, but you may
            not republish full articles without written permission.
          </p>

          <h2>No professional advice</h2>
          <p>
            Content is educational and general in nature. It is not financial, investment, tax or
            legal advice, and it does not consider your personal circumstances.
          </p>

          <h2>Third-party links</h2>
          <p>
            We link to external platforms, tools and apps. We are not responsible for their content,
            pricing, availability or practices. Verify details independently before signing up or
            sending money.
          </p>

          <h2>Advertising and affiliates</h2>
          <p>
            Some pages contain adverts or affiliate links which may earn us a commission at no extra
            cost to you. This never changes our editorial assessment.
          </p>

          <h2>Acceptable use</h2>
          <p>
            Do not attempt to disrupt the site, scrape it at scale, submit abusive messages, or use
            our forms for spam.
          </p>

          <h2>Changes</h2>
          <p>We may update these terms at any time; the latest version always applies.</p>
        </div>
      </div>
    </SiteLayout>
  );
}
