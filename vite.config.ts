import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    // The Cloudflare plugin must come first so the worker environment
    // (KV bindings, vars, `cloudflare:workers` module) is available to SSR.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart(),
    // React's Vite plugin must come after TanStack Start's plugin.
    viteReact(),
  ],
});
