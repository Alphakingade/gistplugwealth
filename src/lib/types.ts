export type ArticleStatus = "draft" | "published";

export type CategoryRef = {
  id: string;
  name: string;
  slug: string;
};

export type Category = CategoryRef & {
  description: string | null;
  icon: string | null;
  featured_image: string | null;
  sort_order: number;
};

export type TagRef = {
  id: string;
  name: string;
  slug: string;
};

export type ArticleCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string;
  read_minutes: number;
  published_at: string | null;
  created_at: string;
  category: CategoryRef | null;
};

export type ArticleFull = ArticleCard & {
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  status: ArticleStatus;
  featured: boolean;
  popular: boolean;
  trending: boolean;
  updated_at: string;
  category_id: string | null;
  tags: TagRef[];
};

export type SiteSettings = Record<string, string>;
