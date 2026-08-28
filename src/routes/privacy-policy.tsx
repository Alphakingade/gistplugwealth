import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SITE } from "@/lib/site";

const TITLE = "Privacy Policy — GistPlugWealth";
const DESCRIPTION =
  "How GistPlugWealth collects, uses and protects reader information, including newsletter emails, contact messages and analytics data.";

export const Route = createFileRoute("/privacy-policy")({
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
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteLayout>
      <div className="container-page max-w-3xl py-14">
        <span className="eyebrow text-emerald">Legal</span>
        <h1 className="mt-2 text-3xl sm:text-4xl">Privacy Policy</h1>
        <div className="prose-article mt-8">
          <p>
            {SITE.name} respects your privacy. This policy explains what information we collect and
            how we use it.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Email address</strong> — only when you subscribe to our newsletter.
            </li>
            <li>
              <strong>Contact details</strong> — the name, email, subject and message you submit
              through our contact form.
            </li>
            <li>
              <strong>Usage data</strong> — anonymous analytics such as pages viewed and general
              location, used to improve our content.
            </li>
          </ul>

          <h2>How we use it</h2>
          <p>
            We use your email only to send articles, guides and occasional opportunities. We use
            contact submissions to reply to you. We do not sell or rent your personal data to third
            parties.
          </p>

          <h2>Cookies and advertising</h2>
          <p>
            We may use cookies for analytics and to serve advertising. Third-party ad networks may
            set their own cookies; you can control cookies through your browser settings.
          </p>

          <h2>Data storage and security</h2>
          <p>
            Subscriber emails and messages are stored in a secured database with access restricted
            to site administrators.
          </p>

          <h2>Your choices</h2>
          <p>
            You can unsubscribe from the newsletter at any time, and you can request deletion of
            your data by contacting us through the contact page.
          </p>

          <h2>Updates</h2>
          <p>
            We may update this policy as the site evolves. Continued use of the site means you
            accept the current version.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
