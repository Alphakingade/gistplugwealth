import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Inbox, LayoutDashboard, LogOut, Settings, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminWhoAmI } from "@/lib/admin.functions";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — GistPlugWealth" },
      { name: "description", content: "GistPlugWealth content management dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/articles", label: "Articles", icon: FileText, exact: false },
  { to: "/admin/taxonomy", label: "Categories & tags", icon: Tags, exact: false },
  { to: "/admin/inbox", label: "Inbox", icon: Inbox, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const whoAmI = useServerFn(adminWhoAmI);
  const { data, isLoading } = useQuery({ queryKey: ["admin-whoami"], queryFn: () => whoAmI() });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!isLoading && data && !data.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <h1 className="text-2xl">Administrator access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your account is signed in but has no admin role yet. Ask an existing administrator to
            grant access.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-6 font-semibold text-primary-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-primary">
              View site
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px,1fr]">
        <nav aria-label="Admin" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-background"
              activeProps={{ className: "bg-background text-primary shadow-card" }}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
