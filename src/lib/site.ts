export const SITE = {
  name: "GistPlugWealth",
  tagline: "Inform. Inspire. Increase.",
  description:
    "Practical tips on saving money, side hustles, apps, online business and making money in Nigeria.",
  url: "https://gistplugwealth.com.ng",
} as const;

export const MAIN_NAV = [
  { label: "Home", to: "/" },
  { label: "Blog", to: "/blog" },
  { label: "Make Money", to: "/category/$slug", slug: "making-money-in-nigeria" },
  { label: "Save Money", to: "/category/$slug", slug: "saving-money" },
  { label: "Student Finance", to: "/category/$slug", slug: "student-finance" },
  { label: "Apps", to: "/category/$slug", slug: "apps" },
  { label: "Resources", to: "/category/$slug", slug: "resources" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

export const SOCIAL_KEYS = [
  { key: "twitter_url", label: "X (Twitter)" },
  { key: "facebook_url", label: "Facebook" },
  { key: "instagram_url", label: "Instagram" },
  { key: "tiktok_url", label: "TikTok" },
  { key: "youtube_url", label: "YouTube" },
] as const;

export function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
