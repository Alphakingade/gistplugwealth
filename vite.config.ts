// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// STATIC_BUILD=1 produces a browser-only bundle (no server), which is what the
// shared cPanel host serves. Everything else keeps the normal server build.
const isStatic = process.env["STATIC_BUILD"] === "1";

// Outside Lovable, honour the host platform. On Vercel we pin the `vercel`
// Nitro preset so the SSR server is emitted as Build Output API functions
// instead of a Cloudflare Worker (which Vercel cannot run).
const isVercel = Boolean(process.env["VERCEL"]) || process.env["NITRO_PRESET"] === "vercel";

export default defineConfig(
  isStatic
    ? {
        nitro: false,
        tanstackStart: { spa: { enabled: true } },
      }
    : {
        ...(isVercel ? { nitro: { preset: "vercel" } } : {}),
        tanstackStart: {
          // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
          // nitro/vite builds from this
          server: { entry: "server" },
        },
      },
);
