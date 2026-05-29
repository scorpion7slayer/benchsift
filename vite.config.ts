import { defineConfig, type Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

/**
 * In server builds, replace `components/model-provider-icon.tsx` with a no-op
 * stub. That module pulls in `@lobehub/icons`' `ProviderIcon` (~20 MB of icon
 * definitions). It is only ever rendered on the client (lazy-loaded behind an
 * `import.meta.env.SSR` guard in `model-provider-icon-lazy.tsx`), so the server
 * never executes it - but Vite still *transforms* it during server builds,
 * which exhausts the heap on memory-constrained CI runners.
 */
function stubModelProviderIconForSSR(): Plugin {
  const STUB_ID = "\0model-provider-icon-ssr-stub";
  return {
    name: "stub-model-provider-icon-ssr",
    resolveId(source, importer) {
      if (
        this.environment?.name !== "client" &&
        source === "./model-provider-icon" &&
        importer?.includes("model-provider-icon-lazy")
      ) {
        return STUB_ID;
      }
      return null;
    },
    load(id) {
      if (id === STUB_ID) {
        return "export function ModelProviderIcon() { return null; }";
      }
      return null;
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    stubModelProviderIconForSSR(),
    tanstackStart(),
    nitro({ preset: "node-server" }),
    // React's Vite plugin must come after TanStack Start's plugin.
    viteReact(),
  ],
});
