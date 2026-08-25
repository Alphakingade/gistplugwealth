import coverOnlineIncome from "@/assets/cover-online-income.jpg";
import coverStudents from "@/assets/cover-students.jpg";
import coverApps from "@/assets/cover-apps.jpg";
import coverBusiness from "@/assets/cover-business.jpg";
import coverSaving from "@/assets/cover-saving.jpg";
import coverDollars from "@/assets/cover-dollars.jpg";

const BY_CATEGORY: Record<string, string> = {
  "making-money-in-nigeria": coverOnlineIncome,
  "student-finance": coverStudents,
  apps: coverApps,
  "online-business": coverBusiness,
  "saving-money": coverSaving,
  "personal-finance": coverDollars,
  investments: coverDollars,
  "ai-and-business": coverBusiness,
  resources: coverApps,
  "side-hustles": coverOnlineIncome,
};

/** Falls back to a category-appropriate image when an article has no featured image. */
export function coverFor(article: {
  featured_image?: string | null;
  category?: { slug: string } | null;
}) {
  if (article.featured_image) return article.featured_image;
  const slug = article.category?.slug ?? "";
  return BY_CATEGORY[slug] ?? coverOnlineIncome;
}
