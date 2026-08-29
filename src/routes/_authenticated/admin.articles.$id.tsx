import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2 } from "lucide-react";
import {
  adminGetArticle,
  adminListTaxonomy,
  adminSaveArticle,
  adminUploadImage,
} from "@/lib/admin.functions";
import { slugify } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/articles/$id")({
  component: ArticleEditor,
});

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  category_id: string;
  author_name: string;
  status: "draft" | "published";
  featured: boolean;
  popular: boolean;
  trending: boolean;
  read_minutes: number;
  seo_title: string;
  seo_description: string;
  tagIds: string[];
};

const EMPTY: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: null,
  category_id: "",
  author_name: "GistPlugWealth Editorial",
  status: "draft",
  featured: false,
  popular: false,
  trending: false,
  read_minutes: 4,
  seo_title: "",
  seo_description: "",
  tagIds: [],
};

const inputClass =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ArticleEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loadArticle = useServerFn(adminGetArticle);
  const loadTaxonomy = useServerFn(adminListTaxonomy);
  const save = useServerFn(adminSaveArticle);
  const upload = useServerFn(adminUploadImage);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const articleQuery = useQuery({
    queryKey: ["admin-article", id],
    queryFn: () => loadArticle({ data: { id } }),
    enabled: !isNew,
  });

  const taxonomyQuery = useQuery({
    queryKey: ["admin-taxonomy"],
    queryFn: () => loadTaxonomy(),
  });

  useEffect(() => {
    if (isNew) return;
    const article = articleQuery.data;
    if (!article) return;
    setForm({
      title: article.title ?? "",
      slug: article.slug ?? "",
      excerpt: article.excerpt ?? "",
      content: article.content ?? "",
      featured_image: article.featured_image ?? null,
      category_id: article.category_id ?? "",
      author_name: article.author_name ?? "GistPlugWealth Editorial",
      status: article.status ?? "draft",
      featured: Boolean(article.featured),
      popular: Boolean(article.popular),
      trending: Boolean(article.trending),
      read_minutes: article.read_minutes ?? 4,
      seo_title: article.seo_title ?? "",
      seo_description: article.seo_description ?? "",
      tagIds: article.tagIds ?? [],
    });
    setSlugTouched(true);
  }, [isNew, articleQuery.data]);

  const categories = taxonomyQuery.data?.categories ?? [];
  const tags = taxonomyQuery.data?.tags ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof adminSaveArticle>[0]["data"]) =>
      save({ data: payload }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      navigate({ to: "/admin/articles" });
      return result;
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Save failed"),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.onload = async () => {
          try {
            const base64 = String(reader.result).split(",")[1] ?? "";
            const result = await upload({
              data: { filename: file.name, contentType: file.type, dataBase64: base64 },
            });
            resolve(result.url);
          } catch (uploadError) {
            reject(uploadError);
          }
        };
        reader.readAsDataURL(file);
      }),
    onSuccess: (url) =>
      setForm((prev) => ({
        ...prev,
        featured_image: url,
      })),
    onError: () => setError("Image upload failed. Try a smaller file (under ~10 MB)."),
  });

  function onPickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  }

  const canSave = form.title.trim().length >= 3 && form.slug.trim().length >= 3;

  const previewText = useMemo(
    () => form.content.split("\n").slice(0, 30).join("\n"),
    [form.content],
  );

  function onSave(nextStatus: "draft" | "published") {
    setError(null);
    saveMutation.mutate({
      ...(isNew ? {} : { id }),
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      featured_image: form.featured_image,
      category_id: form.category_id || null,
      author_name: form.author_name.trim(),
      status: nextStatus,
      featured: form.featured,
      popular: form.popular,
      trending: form.trending,
      read_minutes: form.read_minutes,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      tagIds: form.tagIds,
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-6 rounded-xl border border-border bg-background p-6">
        <h1 className="text-2xl">{isNew ? "New article" : "Edit article"}</h1>

        <div>
          <label htmlFor="title" className="text-sm font-semibold">
            Title
          </label>
          <input
            id="title"
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug: slugTouched ? prev.slug : slugify(title),
              }));
            }}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="slug" className="text-sm font-semibold">
            Slug
          </label>
          <input
            id="slug"
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }));
            }}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Public URL: /article/{form.slug || "your-slug"}
          </p>
        </div>

        <div>
          <label htmlFor="excerpt" className="text-sm font-semibold">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            rows={3}
            value={form.excerpt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, excerpt: event.target.value }))
            }
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="content" className="text-sm font-semibold">
            Content
          </label>
          <textarea
            id="content"
            rows={18}
            value={form.content}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, content: event.target.value }))
            }
            className={`${inputClass} font-mono text-xs`}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Supports **bold**, *italic*, ## headings, lists, &gt; quotes and [links](https://…).
          </p>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canSave || saveMutation.isPending}
            onClick={() => onSave("draft")}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-5 text-sm font-semibold disabled:opacity-60"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save draft
          </button>
          <button
            type="button"
            disabled={!canSave || saveMutation.isPending}
            onClick={() => onSave("published")}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {form.status === "published" ? "Update & keep published" : "Publish"}
          </button>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-lg">Featured image</h2>
          {form.featured_image ? (
            <img
              src={form.featured_image}
              alt="Featured"
              className="mt-3 aspect-[3/2] w-full rounded-md object-cover"
            />
          ) : (
            <div className="mt-3 flex aspect-[3/2] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              No image — a category fallback will be used
            </div>
          )}
          <label className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted">
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            Upload image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPickImage}
              className="sr-only"
            />
          </label>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-background p-5">
          <h2 className="text-lg">Organisation</h2>
          <div>
            <label htmlFor="category" className="text-sm font-semibold">
              Category
            </label>
            <select
              id="category"
              value={form.category_id}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category_id: event.target.value }))
              }
              className={inputClass}
            >
              <option value="">No category</option>
              {categories.map((category: { id: string; name: string }) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold">Tags</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag: { id: string; name: string }) => {
                const active = form.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        tagIds: active
                          ? prev.tagIds.filter((tagId) => tagId !== tag.id)
                          : [...prev.tagIds, tag.id],
                      }))
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="author" className="text-sm font-semibold">
              Author name
            </label>
            <input
              id="author"
              value={form.author_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, author_name: event.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="read_minutes" className="text-sm font-semibold">
              Read minutes
            </label>
            <input
              id="read_minutes"
              type="number"
              min={1}
              max={60}
              value={form.read_minutes}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  read_minutes: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-1 text-sm font-semibold">
            {(["featured", "trending", "popular"] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2 capitalize">
                <input
                  type="checkbox"
                  checked={form[flag]}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [flag]: event.target.checked }))
                  }
                  className="h-4 w-4 accent-emerald"
                />
                {flag}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-background p-5">
          <h2 className="text-lg">SEO</h2>
          <div>
            <label htmlFor="seo_title" className="text-sm font-semibold">
              SEO title
            </label>
            <input
              id="seo_title"
              value={form.seo_title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, seo_title: event.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="seo_description" className="text-sm font-semibold">
              SEO description
            </label>
            <textarea
              id="seo_description"
              rows={3}
              value={form.seo_description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, seo_description: event.target.value }))
              }
              className={inputClass}
            />
          </div>
        </section>

        {previewText ? (
          <section className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-lg">Preview (first lines)</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{previewText}</p>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
