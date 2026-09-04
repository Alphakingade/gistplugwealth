import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: boolean | null; error: unknown }>;
  };
  const { data } = await supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("You do not have administrator access.");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const supabase = context.supabase;

    const countOf = async (
      table: "articles" | "categories" | "tags" | "newsletter_subscribers" | "contact_messages",
      apply?: (q: ReturnType<typeof supabase.from>) => unknown,
    ) => {
      let query = supabase.from(table).select("id", { count: "exact", head: true });
      if (apply) query = apply(query as never) as typeof query;
      const { count } = await query;
      return count ?? 0;
    };

    const [total, published, drafts, categories, tags, subscribers, messages] = await Promise.all([
      countOf("articles"),
      countOf("articles", (q) => (q as never as typeof q).eq("status", "published")),
      countOf("articles", (q) => (q as never as typeof q).eq("status", "draft")),
      countOf("categories"),
      countOf("tags"),
      countOf("newsletter_subscribers"),
      countOf("contact_messages"),
    ]);

    const { data: recent } = await supabase
      .from("articles")
      .select("id,title,slug,status,updated_at")
      .order("updated_at", { ascending: false })
      .limit(5);

    return {
      stats: { total, published, drafts, categories, tags, subscribers, messages },
      recent: recent ?? [],
    };
  });

export const adminListArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("articles")
      .select(
        "id,title,slug,status,featured,popular,trending,updated_at,published_at,category:categories(id,name,slug)",
      )
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminGetArticle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: article, error } = await context.supabase
      .from("articles")
      .select("*,article_tags(tag_id)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!article) return null;
    return {
      ...article,
      tagIds: (article.article_tags ?? []).map((row: { tag_id: string }) => row.tag_id),
    };
  });

export const adminSaveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => articleInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabase = context.supabase;
    const { id, tagIds, ...fields } = data;

    let publishedAt: string | null | undefined;
    if (fields.status === "published") {
      const existing = id
        ? await supabase.from("articles").select("published_at").eq("id", id).maybeSingle()
        : null;
      publishedAt = existing?.data?.published_at ?? new Date().toISOString();
    }

    const payload = {
      ...fields,
      author_id: context.userId,
      ...(publishedAt !== undefined ? { published_at: publishedAt } : {}),
    };

    let articleId = id;
    if (id) {
      const { error } = await supabase.from("articles").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await supabase
        .from("articles")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      articleId = inserted.id;
    }

    await supabase.from("article_tags").delete().eq("article_id", articleId!);
    if (tagIds.length > 0) {
      await supabase
        .from("article_tags")
        .insert(tagIds.map((tagId) => ({ article_id: articleId!, tag_id: tagId })));
    }

    return { id: articleId! };
  });

export const adminSetArticleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["draft", "published"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabase = context.supabase;
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "published") {
      const { data: existing } = await supabase
        .from("articles")
        .select("published_at")
        .eq("id", data.id)
        .maybeSingle();
      patch['published_at'] = existing?.published_at ?? new Date().toISOString();
    }
    const { error } = await supabase.from("articles").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorderCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        order: z
          .array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0).max(999) }))
          .max(60),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    for (const row of data.order) {
      const { error } = await context.supabase
        .from("categories")
        .update({ sort_order: row.sort_order })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteArticle = createServerFn({ method: "POST" })

  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => categoryInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const query = id
      ? context.supabase.from("categories").update(fields).eq("id", id)
      : context.supabase.from("categories").insert(fields);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => tagInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const query = id
      ? context.supabase.from("tags").update(fields).eq("id", id)
      : context.supabase.from("tags").insert(fields);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tags").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateMessageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "handled"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("contact_messages")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ settings: z.record(z.string().max(60), z.string().trim().max(300)) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const rows = Object.entries(data.settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await context.supabase.from("site_settings").upsert(rows);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        filename: z.string().trim().min(1).max(160),
        contentType: z.string().trim().max(100),
        dataBase64: z.string().max(14_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const binary = Uint8Array.from(atob(data.dataBase64), (char) => char.charCodeAt(0));
    const safeName = data.filename.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;

    const { error } = await context.supabase.storage
      .from("article-images")
      .upload(path, binary, { contentType: data.contentType || "image/jpeg", upsert: false });

    if (error) throw new Error(error.message);
    return { url: `/api/public/media/${path}` };
  });

export const adminListTaxonomy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [categories, tags] = await Promise.all([
      context.supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      context.supabase.from("tags").select("*").order("name", { ascending: true }),
    ]);
    return { categories: categories.data ?? [], tags: tags.data ?? [] };
  });

export const adminWhoAmI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (
      context.supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null }>;
      }
    ).rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { userId: context.userId, isAdmin: Boolean(data) };
  });

export const adminListAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await (
      context.supabase as unknown as {
        rpc: (fn: string) => Promise<{
          data:
            | {
                user_id: string;
                email: string;
                granted_at: string;
                last_sign_in_at: string | null;
              }[]
            | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("list_admin_users");
    if (error) throw new Error(error.message);
    return { admins: data ?? [], me: context.userId };
  });

export const adminGrantAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: result, error } = await (
      context.supabase as unknown as {
        rpc: (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{
          data: { ok: boolean; message: string } | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("grant_admin_by_email", { _email: data.email });
    if (error) throw new Error(error.message);
    return result ?? { ok: false, message: "Unexpected error" };
  });

export const adminRevokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: result, error } = await (
      context.supabase as unknown as {
        rpc: (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{
          data: { ok: boolean; message: string } | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("revoke_admin", { _user_id: data.id });
    if (error) throw new Error(error.message);
    return result ?? { ok: false, message: "Unexpected error" };
  });
