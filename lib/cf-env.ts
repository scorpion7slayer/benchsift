// Server-only accessor for Cloudflare Workers bindings + vars.
//
// Replaces `getCloudflareContext()` from `@opennextjs/cloudflare`. The
// `cloudflare:workers` virtual module is provided by `@cloudflare/vite-plugin`
// and exposes the per-request worker environment (KV namespaces, vars…).
//
// This file must never be value-imported by client code — it is only reached
// from server functions, server routes and the worker entry. The marker
// import below makes TanStack Start's import-protection enforce that.
import "@tanstack/react-start/server-only";
import { env } from "cloudflare:workers";

/** Returns the Cloudflare env, or `null` when running outside a worker. */
export function getCfEnv(): CloudflareEnv | null {
  try {
    return env as unknown as CloudflareEnv;
  } catch {
    return null;
  }
}

/** Returns the KV namespace used for the models cache, or `null`. */
export function getModelsKV(): KVNamespace | null {
  return getCfEnv()?.MODELS_KV ?? null;
}
