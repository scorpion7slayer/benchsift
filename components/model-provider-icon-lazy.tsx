"use client";
import dynamic from "next/dynamic";

// Loaded client-side only to exclude @lobehub/icons from the server bundle
export const ModelProviderIcon = dynamic(
  () => import("./model-provider-icon").then((m) => ({ default: m.ModelProviderIcon })),
  { ssr: false }
);
