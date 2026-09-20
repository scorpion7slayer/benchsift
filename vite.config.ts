import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: "node-server",
      routeRules: {
        "/**": { headers: {
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
          "X-Frame-Options": "DENY",
          "Content-Security-Policy": "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        } },
        "/logos/**": { headers: { "Cache-Control": "public, max-age=86400" } },
        "/fonts/**": { headers: { "Cache-Control": "public, max-age=86400" } },
      },
    }),
    // React's Vite plugin must come after TanStack Start's plugin.
    viteReact(),
  ],
});
