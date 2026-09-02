// Keeps server-side code working on hosts (e.g. Vercel) where only the build-time
// VITE_* values are present. Vite inlines import.meta.env.VITE_* at build time, so
// these constants ship with the server bundle and fill any missing process.env keys.
const FALLBACKS: Record<string, string | undefined> = {
  SUPABASE_URL: import.meta.env["VITE_SUPABASE_URL"],
  SUPABASE_PUBLISHABLE_KEY: import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
  SUPABASE_PROJECT_ID: import.meta.env["VITE_SUPABASE_PROJECT_ID"],
};

export function applyEnvFallbacks() {
  if (typeof process === "undefined" || !process.env) return;
  for (const [key, value] of Object.entries(FALLBACKS)) {
    if (!process.env[key] && value) process.env[key] = value;
  }
}

applyEnvFallbacks();
