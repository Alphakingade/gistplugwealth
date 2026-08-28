import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/site/Logo";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — GistPlugWealth Admin" },
      { name: "description", content: "Secure sign in for GistPlugWealth editors and admins." },
      { property: "og:title", content: "Sign in — GistPlugWealth Admin" },
      { property: "og:description", content: "Secure sign in for GistPlugWealth editors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/admin", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
        if (signInError) setError(signInError.message);
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (signUpError) setError(signUpError.message);
        else if (!data.session)
          setMessage("Check your email to confirm your account, then sign in.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("Google sign-in failed. Please try again.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-soft px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lift">
        <Logo />
        <h1 className="mt-6 text-2xl">{mode === "signin" ? "Admin sign in" : "Create account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is for GistPlugWealth editors managing the publication.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary font-semibold text-primary-foreground disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-md border border-border font-semibold hover:bg-muted"
        >
          Continue with Google
        </button>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-4 text-sm text-primary">
            {message}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
