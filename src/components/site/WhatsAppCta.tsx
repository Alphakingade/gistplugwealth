import { MessageCircle } from "lucide-react";

export function WhatsAppCta({ url }: { url?: string | undefined }) {
  const configured = Boolean(url && url.trim());

  return (
    <section className="surface hover-lift relative overflow-hidden p-6 sm:p-10">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <span className="eyebrow text-emerald">Community</span>
          <h2 className="mt-2 text-2xl sm:text-3xl">Don&apos;t Miss New Opportunities</h2>
          <p className="mt-2 text-muted-foreground">
            Join the GistPlugWealth WhatsApp community for new guides, tools and money-making
            opportunities as they drop.
          </p>
        </div>

        {configured ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg btn-emerald pulse-ring shrink-0"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Join WhatsApp
          </a>
        ) : (
          <div className="shrink-0 rounded-xl border border-dashed border-border px-5 py-3 text-sm text-muted-foreground">
            Add your WhatsApp community link in admin settings to activate this button.
          </div>
        )}
      </div>
    </section>
  );
}
