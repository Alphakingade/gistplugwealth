import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import {
  Copy,
  ExternalLink,
  Flame,
  Loader2,
  Pencil,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import {
  adminBulkArticles,
  adminDeleteArticle,
  adminDuplicateArticle,
  adminListArticles,
  adminSetArticleFlags,
  adminSetArticleStatus,
  type AdminArticleRow,
} from "@/lib/admin.functions";
import { formatDate } from "@/lib/site";
import { resolveImageUrl } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/admin/articles/")({
  component: AdminArticles,
});

type Sort = "newest" | "oldest" | "title";
type FlagFilter = "any" | "featured" | "popular" | "trending";
const PAGE_SIZE = 20;

function AdminArticles() {
  const list = useServerFn(adminListArticles);
  const remove = useServerFn(adminDeleteArticle);
  const setStatus = useServerFn(adminSetArticleStatus);
  const setFlags = useServerFn(adminSetArticleFlags);
  const duplicate = useServerFn(adminDuplicateArticle);
  const bulk = useServerFn(adminBulkArticles);
  const queryClient = useQueryClient();

  const [status, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [category, setCategory] = useState("all");
  const [flag, setFlag] = useState<FlagFilter>("any");
  const [sort, setSort] = useState<Sort>("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: () => list(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };
  const fail = (err: unknown) =>
    setNotice({
      kind: "error",
      text: err instanceof Error ? err.message : "Something went wrong.",
    });

  const deletion = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      setNotice({ kind: "ok", text: "Article deleted." });
      refresh();
    },
    onError: fail,
  });

  const statusChange = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "published" }) => setStatus({ data: vars }),
    onSuccess: (_r, vars) => {
      setNotice({
        kind: "ok",
        text: vars.status === "published" ? "Article published." : "Moved back to draft.",
      });
      refresh();
    },
    onError: fail,
  });

  const flagChange = useMutation({
    mutationFn: (vars: { id: string } & Partial<Record<FlagFilter, boolean>>) =>
      setFlags({ data: vars }),
    onSuccess: () => refresh(),
    onError: fail,
  });

  const duplication = useMutation({
    mutationFn: (id: string) => duplicate({ data: { id } }),
    onSuccess: () => {
      setNotice({ kind: "ok", text: "Copy created as a draft." });
      refresh();
    },
    onError: fail,
  });

  const bulkAction = useMutation({
    mutationFn: (action: string) => bulk({ data: { ids: selected, action } }),
    onSuccess: (result: { count?: number }) => {
      setNotice({ kind: "ok", text: `Updated ${result?.count ?? selected.length} article(s).` });
      setSelected([]);
      refresh();
    },
    onError: fail,
  });

  const rows: AdminArticleRow[] = data ?? [];

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.category) map.set(row.category.id, row.category.name);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = rows
      .filter((row) => status === "all" || row.status === status)
      .filter((row) =>
        category === "all"
          ? true
          : category === "none"
            ? !row.category
            : row.category?.id === category,
      )
      .filter((row) => (flag === "any" ? true : Boolean(row[flag])))
      .filter(
        (row) =>
          !term ||
          row.title.toLowerCase().includes(term) ||
          row.slug.toLowerCase().includes(term) ||
          (row.excerpt ?? "").toLowerCase().includes(term),
      );

    return result.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      const aTime = new Date(a.published_at ?? a.created_at).getTime();
      const bTime = new Date(b.published_at ?? b.created_at).getTime();
      return sort === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [rows, status, category, flag, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const allVisibleSelected =
    visible.length > 0 && visible.every((row) => selected.includes(row.id));

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const busy = bulkAction.isPending || deletion.isPending || duplication.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Articles</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} total · {rows.filter((r) => r.status === "published").length} published ·{" "}
            {rows.filter((r) => r.status === "draft").length} drafts
          </p>
        </div>
        <Link to="/admin/articles/$id" params={{ id: "new" }} className="btn btn-sm btn-primary">
          New article
        </Link>
      </div>

      {notice ? (
        <p
          role="status"
          className={`rounded-lg border px-4 py-2 text-sm ${
            notice.kind === "ok"
              ? "border-emerald/40 bg-primary-soft text-primary"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={search}
          onChange={(event) => resetPage(setSearch)(event.target.value)}
          placeholder="Search title, slug or excerpt…"
          aria-label="Search articles"
          className="field h-10 text-sm lg:col-span-2"
        />
        <select
          value={status}
          onChange={(event) => resetPage(setStatusFilter)(event.target.value as typeof status)}
          aria-label="Filter by status"
          className="field h-10 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={category}
          onChange={(event) => resetPage(setCategory)(event.target.value)}
          aria-label="Filter by category"
          className="field h-10 text-sm"
        >
          <option value="all">All categories</option>
          <option value="none">No category</option>
          {categories.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={flag}
          onChange={(event) => resetPage(setFlag)(event.target.value as FlagFilter)}
          aria-label="Filter by highlight"
          className="field h-10 text-sm"
        >
          <option value="any">Any highlight</option>
          <option value="featured">Featured</option>
          <option value="popular">Popular</option>
          <option value="trending">Trending</option>
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as Sort)}
          aria-label="Sort articles"
          className="field h-10 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <strong className="mr-1">{selected.length} selected</strong>
          <button
            type="button"
            disabled={busy}
            onClick={() => bulkAction.mutate("publish")}
            className="btn btn-sm btn-quiet"
          >
            Publish
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => bulkAction.mutate("draft")}
            className="btn btn-sm btn-quiet"
          >
            Move to draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => bulkAction.mutate("feature")}
            className="btn btn-sm btn-quiet"
          >
            Feature
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => bulkAction.mutate("popular")}
            className="btn btn-sm btn-quiet"
          >
            Mark popular
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => bulkAction.mutate("trending")}
            className="btn btn-sm btn-quiet"
          >
            Mark trending
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const answer = prompt(
                `Permanently delete ${selected.length} article(s)? Type DELETE to confirm.`,
              );
              if (answer === "DELETE") bulkAction.mutate("delete");
            }}
            className="btn btn-sm btn-quiet text-destructive"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="btn btn-sm btn-quiet sm:ml-auto"
          >
            Clear
          </button>
        </div>
      ) : null}

      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load articles."}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-background">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allVisibleSelected}
                  onChange={(event) =>
                    setSelected((prev) =>
                      event.target.checked
                        ? [...new Set([...prev, ...visible.map((row) => row.id)])]
                        : prev.filter((id) => !visible.some((row) => row.id === id)),
                    )
                  }
                  className="h-4 w-4 accent-emerald"
                />
              </th>
              <th className="p-4 font-semibold">Article</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Author</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Highlights</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((row) => {
              const image = resolveImageUrl(row.featured_image);
              return (
                <tr key={row.id} className={selected.includes(row.id) ? "bg-muted/30" : undefined}>
                  <td className="p-4 align-top">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.title}`}
                      checked={selected.includes(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="h-4 w-4 accent-emerald"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-start gap-3">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          className="h-12 w-16 flex-none rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-12 w-16 flex-none rounded-md border border-dashed border-border" />
                      )}
                      <div>
                        <Link
                          to="/admin/articles/$id"
                          params={{ id: row.id }}
                          className="font-semibold hover:text-primary"
                        >
                          {row.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">/{row.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{row.category?.name ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">{row.author_name}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.status === "published"
                          ? "bg-primary-soft text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {formatDate(row.published_at ?? row.created_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {(
                        [
                          ["featured", Star],
                          ["popular", Sparkles],
                          ["trending", Flame],
                        ] as const
                      ).map(([key, Icon]) => (
                        <button
                          key={key}
                          type="button"
                          title={`${row[key] ? "Remove" : "Mark"} ${key}`}
                          aria-label={`${row[key] ? "Remove" : "Mark"} ${key} on ${row.title}`}
                          aria-pressed={row[key]}
                          onClick={() => flagChange.mutate({ id: row.id, [key]: !row[key] })}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 ${
                            row[key]
                              ? "border-emerald bg-primary-soft text-primary"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={statusChange.isPending}
                        onClick={() =>
                          statusChange.mutate({
                            id: row.id,
                            status: row.status === "published" ? "draft" : "published",
                          })
                        }
                        className="btn btn-sm btn-quiet"
                      >
                        {row.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <Link
                        to="/admin/articles/$id"
                        params={{ id: row.id }}
                        aria-label={`Edit ${row.title}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-emerald hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        disabled={duplication.isPending}
                        aria-label={`Duplicate ${row.title}`}
                        title="Duplicate as draft"
                        onClick={() => {
                          if (confirm(`Create a draft copy of “${row.title}”?`))
                            duplication.mutate(row.id);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-emerald hover:text-primary"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={`/article/${row.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View ${row.title}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-emerald hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        aria-label={`Delete ${row.title}`}
                        onClick={() => {
                          if (confirm(`Delete “${row.title}”? This cannot be undone.`)) {
                            deletion.mutate(row.id);
                          }
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-destructive transition-all hover:-translate-y-0.5 hover:border-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : null}
            {!isLoading && visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  {rows.length === 0
                    ? "No articles yet — create your first one."
                    : "No articles match these filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Page {currentPage} of {pageCount} · {filtered.length} articles
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="btn btn-sm btn-quiet"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="btn btn-sm btn-quiet"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
