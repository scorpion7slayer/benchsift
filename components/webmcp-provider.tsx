"use client";

import { useEffect } from "react";

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
};

type WebMcpContext = {
  name: string;
  version: string;
  tools: WebMcpTool[];
};

declare global {
  interface Navigator {
    modelContext?: {
      provideContext: (
        context: WebMcpContext,
      ) => void | (() => void) | Promise<void | (() => void)>;
    };
  }
}

function modelLinks(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const anchors = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[href^="/models/"]'),
  );

  return anchors
    .map((anchor) => ({
      title: anchor.textContent?.replace(/\s+/g, " ").trim() ?? "",
      url: new URL(anchor.getAttribute("href") ?? "", window.location.origin).href,
    }))
    .filter((item, index, items) => {
      if (!item.title || !item.url) return false;
      if (items.findIndex((candidate) => candidate.url === item.url) !== index) {
        return false;
      }
      return !normalizedQuery || item.title.toLowerCase().includes(normalizedQuery);
    })
    .slice(0, 10);
}

export function WebMcpProvider() {
  useEffect(() => {
    const modelContext = navigator.modelContext;
    if (!modelContext?.provideContext) return;

    let cleanup: void | (() => void);
    const tools: WebMcpTool[] = [
      {
        name: "search_visible_models",
        description:
          "Search model links currently visible on the BenchSift page and return matching URLs.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Model or provider text to search for.",
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
        execute: ({ query }) => ({
          results: modelLinks(typeof query === "string" ? query : ""),
        }),
      },
      {
        name: "open_benchsift_page",
        description:
          "Navigate to a primary BenchSift page for model discovery, comparison, or coding benchmarks.",
        inputSchema: {
          type: "object",
          properties: {
            page: {
              type: "string",
              enum: ["home", "compare", "coding_agents", "deepswe"],
            },
          },
          required: ["page"],
          additionalProperties: false,
        },
        execute: ({ page }) => {
          const paths: Record<string, string> = {
            home: "/",
            compare: "/compare",
            coding_agents: "/agents/coding",
            deepswe: "/benchmarks/deepswe",
          };
          const path = paths[typeof page === "string" ? page : ""] ?? "/";
          window.location.assign(path);
          return { url: new URL(path, window.location.origin).href };
        },
      },
    ];

    Promise.resolve(
      modelContext.provideContext({
        name: "BenchSift",
        version: "0.1.0",
        tools,
      }),
    )
      .then((result) => {
        cleanup = result;
      })
      .catch(() => {
        cleanup = undefined;
      });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return null;
}

