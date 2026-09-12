/**
 * Admin data layer.
 *
 * Plain async functions running in the browser. Every call first confirms the
 * signed-in account holds the `admin` role (via the `has_role` database
 * function); row level security enforces the same rule server-side, so a
 * tampered client still cannot write.
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { publicImageUrl } from "./media";

/** Loosely-typed handle: the admin surface writes many partial shapes. */
const db = supabase as unknown as SupabaseClient;

const articleInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and dashes"),
  excerpt: z.string().trim().max(400).nullable().default(null),
  content: z.string().max(120000).default(""),
  featured_image: z.string().trim().max(600).nullable().default(null),
  category_id: z.string().uuid().nullable().default(null),
  author_name: z.string().trim().min(2).max(120),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  trending: z.boolean().default(false),
  read_minutes: z.number().int().min(1).max(60).default(4),
  seo_title: z.string().trim().max(200).nullable().default(null),
  seo_description: z.string().trim().max(320).nullable().default(null),
  tagIds: z.array(z.string().uuid()).max(20).default([]),
});

const categoryInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and dashes"),
  description: z.string().trim().max(400).nullable().default(null),
  icon: z.string().trim().max(60).nullable().default(null),
  featured_image: z.string().trim().max(600).nullable().default(null),
  sort_order: z.number().int().min(0).max(999).default(0),
});

const tagInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and dashes"),
});

const idInput = z.object({ id: z.string().uuid() });

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in again.");
  return data.user.id;
}

async function isAdmin(userId: string) {
  const { data } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
  return Boolean(data);
}

/** Resolves to the signed-in admin's id, or throws. */
async function requireAdmin() {
  const userId = await currentUserId();
  if (!(await isAdmin(userId))) throw new Error("You do not have administrator access.");
  return userId;
}

export async function getAdminOverview() {
  await requireAdmin();

  const countOf = async (
    table: "articles" | "categories" | "tags" | "newsletter_subscribers" | "contact_messages",
    status?: "draft" | "published",
  ) => {
    let query = db.from(table).select("id", { count: "exact", head: true });
    if (status) query = query.eq("status", status);
    const { count } = await query;
    return count ?? 0;
  };

  const [total, published, drafts, categories, tags, subscribers, messages] = await Promise.all([
    countOf("articles"),
    countOf("articles", "published"),
    countOf("articles", "draft"),
    countOf("categories"),
    countOf("tags"),
    countOf("newsletter_subscribers"),
    countOf("contact_messages"),
  ]);

  const { data: recent } = await db
    .from("articles")
    .select("id,title,slug,status,updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  return {
    stats: { total, published, drafts, categories, tags, subscribers, messages },
    recent: recent ?? [],
  };
}

export async function adminListArticles() {
  await requireAdmin();
  const { data, error } = await db
    .from("articles")
    .select(
      "id,title,slug,status,featured,popular,trending,updated_at,published_at,category:categories(id,name,slug)",
    )
    .order("updated_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminGetArticle({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { id } = idInput.parse(input);
  const { data: article, error } = await db
    .from("articles")
    .select("*,article_tags(tag_id)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!article) return null;
  return {
    ...article,
    tagIds: (article.article_tags ?? []).map((row: { tag_id: string }) => row.tag_id),
  };
}

export async function adminSaveArticle({ data: input }: { data: unknown }) {
  const userId = await requireAdmin();
  const { id, tagIds, ...fields } = articleInput.parse(input);

  let publishedAt: string | null | undefined;
  if (fields.status === "published") {
    const existing = id
      ? await db.from("articles").select("published_at").eq("id", id).maybeSingle()
      : null;
    publishedAt = existing?.data?.published_at ?? new Date().toISOString();
  }

  const payload = {
    ...fields,
    author_id: userId,
    ...(publishedAt !== undefined ? { published_at: publishedAt } : {}),
  };

  let articleId = id;
  if (id) {
    const { error } = await db.from("articles").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data: inserted, error } = await db
      .from("articles")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    articleId = inserted.id;
  }

  const { error: clearError } = await db
    .from("article_tags")
    .delete()
    .eq("article_id", articleId!);
  if (clearError) throw new Error(`Could not update tags: ${clearError.message}`);

  if (tagIds.length > 0) {
    const { error: tagError } = await db
      .from("article_tags")
      .insert(tagIds.map((tagId) => ({ article_id: articleId!, tag_id: tagId })));
    if (tagError) throw new Error(`Could not save tags: ${tagError.message}`);
  }

  return { id: articleId! };
}

export async function adminSetArticleStatus({ data: input }: { data: unknown }) {
  await requireAdmin();
  const parsed = z
    .object({ id: z.string().uuid(), status: z.enum(["draft", "published"]) })
    .parse(input);

  const patch: { status: "draft" | "published"; published_at?: string } = {
    status: parsed.status,
  };
  if (parsed.status === "published") {
    const { data: existing } = await db
      .from("articles")
      .select("published_at")
      .eq("id", parsed.id)
      .maybeSingle();
    patch.published_at = existing?.published_at ?? new Date().toISOString();
  }
  const { error } = await db.from("articles").update(patch).eq("id", parsed.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminReorderCategories({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { order } = z
    .object({
      order: z
        .array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0).max(999) }))
        .max(60),
    })
    .parse(input);

  for (const row of order) {
    const { error } = await db
      .from("categories")
      .update({ sort_order: row.sort_order })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  }
  return { ok: true };
}

export async function adminDeleteArticle({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { id } = idInput.parse(input);
  const { error } = await db.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminSaveCategory({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { id, ...fields } = categoryInput.parse(input);
  const query = id
    ? db.from("categories").update(fields).eq("id", id)
    : db.from("categories").insert(fields);
  const { error } = await query;
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminDeleteCategory({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { id } = idInput.parse(input);
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminSaveTag({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { id, ...fields } = tagInput.parse(input);
  const query = id ? db.from("tags").update(fields).eq("id", id) : db.from("tags").insert(fields);
  const { error } = await query;
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminDeleteTag({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { id } = idInput.parse(input);
  const { error } = await db.from("tags").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminListSubscribers() {
  await requireAdmin();
  const { data, error } = await db
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminListMessages() {
  await requireAdmin();
  const { data, error } = await db
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminUpdateMessageStatus({ data: input }: { data: unknown }) {
  await requireAdmin();
  const parsed = z
    .object({ id: z.string().uuid(), status: z.enum(["new", "handled"]) })
    .parse(input);
  const { error } = await db
    .from("contact_messages")
    .update({ status: parsed.status })
    .eq("id", parsed.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminSaveSettings({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { settings } = z
    .object({ settings: z.record(z.string().max(60), z.string().trim().max(300)) })
    .parse(input);

  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await db.from("site_settings").upsert(rows);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** Largest image the editor will accept, in bytes. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Uploads the picked file straight from the browser to the images bucket.
 * Storage rules allow writes only for accounts holding the admin role.
 */
export async function adminUploadImage({ data }: { data: { file: File } }) {
  await requireAdmin();
  const file = data?.file;
  if (!file) throw new Error("No file selected.");

  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not an image. Choose a JPG, PNG or WebP.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`That image is ${mb} MB. Please keep images under 10 MB.`);
  }

  const safeName = (file.name || "image.jpg").toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage
    .from("article-images")
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });

  if (error) throw new Error(error.message);
  return { url: publicImageUrl(path) };
}

export async function adminListTaxonomy() {
  await requireAdmin();
  const [categories, tags] = await Promise.all([
    db.from("categories").select("*").order("sort_order", { ascending: true }),
    db.from("tags").select("*").order("name", { ascending: true }),
  ]);
  return { categories: categories.data ?? [], tags: tags.data ?? [] };
}

export async function adminWhoAmI() {
  const userId = await currentUserId();
  return { userId, isAdmin: await isAdmin(userId) };
}

export async function adminListAdmins() {
  const me = await requireAdmin();
  const { data, error } = await db.rpc("list_admin_users");
  if (error) throw new Error(error.message);
  return {
    admins: (data ?? []) as {
      user_id: string;
      email: string;
      granted_at: string;
      last_sign_in_at: string | null;
    }[],
    me,
  };
}

export async function adminGrantAdmin({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { email } = z.object({ email: z.string().trim().email().max(255) }).parse(input);
  const { data: result, error } = await db.rpc("grant_admin_by_email", { _email: email });
  if (error) throw new Error(error.message);
  return (result as { ok: boolean; message: string } | null) ?? {
    ok: false,
    message: "Unexpected error",
  };
}

export async function adminRevokeAdmin({ data: input }: { data: unknown }) {
  await requireAdmin();
  const { id } = idInput.parse(input);
  const { data: result, error } = await db.rpc("revoke_admin", { _user_id: id });
  if (error) throw new Error(error.message);
  return (result as { ok: boolean; message: string } | null) ?? {
    ok: false,
    message: "Unexpected error",
  };
}
