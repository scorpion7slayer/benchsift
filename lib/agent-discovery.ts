import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

export const API_CATALOG_PATH = "/.well-known/api-catalog";
export const OPENAPI_PATH = "/.well-known/openapi.json";
export const AGENT_SKILLS_INDEX_PATH = "/.well-known/agent-skills/index.json";
export const MCP_SERVER_CARD_PATH = "/.well-known/mcp/server-card.json";
export const API_DOCS_PATH = "/docs/api";
export const AUTH_MD_PATH = "/auth.md";

interface LinkHeaderItem {
  path: string;
  rel: string;
  type: string;
  title?: string;
}

const discoveryLinks: LinkHeaderItem[] = [
  {
    path: API_CATALOG_PATH,
    rel: "api-catalog",
    type: "application/linkset+json",
    title: "BenchSift API catalog",
  },
  {
    path: OPENAPI_PATH,
    rel: "service-desc",
    type: "application/openapi+json",
    title: "BenchSift OpenAPI description",
  },
  {
    path: API_DOCS_PATH,
    rel: "service-doc",
    type: "text/markdown",
    title: "BenchSift API documentation",
  },
  {
    path: AGENT_SKILLS_INDEX_PATH,
    rel: "service-desc",
    type: "application/json",
    title: "BenchSift agent skills index",
  },
  {
    path: MCP_SERVER_CARD_PATH,
    rel: "service-desc",
    type: "application/json",
    title: "BenchSift MCP server card",
  },
  {
    path: AUTH_MD_PATH,
    rel: "service-doc",
    type: "text/markdown",
    title: "BenchSift agent authentication notes",
  },
];

function quoteHeaderValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export function agentDiscoveryLinkHeader(): string {
  return discoveryLinks
    .map((link) => {
      const params = [
        `rel="${quoteHeaderValue(link.rel)}"`,
        `type="${quoteHeaderValue(link.type)}"`,
      ];
      if (link.title) params.push(`title="${quoteHeaderValue(link.title)}"`);
      return `<${link.path}>; ${params.join("; ")}`;
    })
    .join(", ");
}

export function apiCatalogLinkset() {
  return {
    linkset: [
      {
        anchor: absoluteUrl("/"),
        "api-catalog": [
          {
            href: absoluteUrl(API_CATALOG_PATH),
            type: "application/linkset+json",
          },
        ],
        "service-desc": [
          {
            href: absoluteUrl(OPENAPI_PATH),
            type: "application/openapi+json",
            title: "OpenAPI description",
          },
        ],
        "service-doc": [
          {
            href: absoluteUrl(API_DOCS_PATH),
            type: "text/markdown",
            title: "API documentation",
          },
          {
            href: absoluteUrl(AUTH_MD_PATH),
            type: "text/markdown",
            title: "Agent authentication notes",
          },
        ],
        status: [
          {
            href: absoluteUrl("/health"),
            type: "application/json",
            title: "Service health",
          },
        ],
      },
    ],
  };
}

export function openApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: `${SITE_NAME} operational API`,
      version: "0.1.0",
      description:
        "Operational endpoints exposed by BenchSift. The public website is browsable without API authentication; cron endpoints are private deployment operations.",
    },
    servers: [{ url: SITE_URL }],
    paths: {
      "/health": {
        get: {
          operationId: "getHealth",
          summary: "Check service health",
          responses: {
            "200": {
              description: "The service is healthy.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { ok: { type: "boolean", const: true } },
                    required: ["ok"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/cron/status": {
        get: {
          operationId: "getCronCacheStatus",
          summary: "Read the private model-cache refresh status",
          security: [{ cronBearer: [] }],
          responses: {
            "200": { description: "Cache status." },
            "401": { description: "Missing or invalid CRON_SECRET bearer token." },
          },
        },
      },
      "/api/cron/refresh": {
        post: {
          operationId: "refreshModelCache",
          summary: "Trigger a private model-cache refresh",
          security: [{ cronBearer: [] }],
          responses: {
            "200": { description: "Refresh completed." },
            "401": { description: "Missing or invalid CRON_SECRET bearer token." },
            "405": { description: "Method not allowed." },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        cronBearer: {
          type: "http",
          scheme: "bearer",
          description:
            "Private deployment secret configured as CRON_SECRET. This is not an OAuth token and is not issued to third-party agents.",
        },
      },
    },
  };
}

export function mcpServerCard() {
  return {
    serverInfo: {
      name: SITE_NAME,
      version: "0.1.0",
    },
    description:
      "BenchSift exposes browser-side WebMCP tools for model discovery and navigation. It does not currently expose a remote MCP protocol endpoint.",
    transport: {
      type: "webmcp",
      endpoint: absoluteUrl("/"),
    },
    capabilities: {
      tools: [
        {
          name: "search_visible_models",
          description:
            "Search model links currently visible on the BenchSift page and return matching URLs.",
        },
        {
          name: "open_benchsift_page",
          description:
            "Navigate to a primary BenchSift page for model discovery, comparison, or coding benchmarks.",
        },
      ],
      resources: [
        {
          name: "api-catalog",
          url: absoluteUrl(API_CATALOG_PATH),
        },
        {
          name: "agent-skills",
          url: absoluteUrl(AGENT_SKILLS_INDEX_PATH),
        },
      ],
    },
  };
}

export const apiDocsMarkdown = `# ${SITE_NAME} API

${DEFAULT_DESCRIPTION}

## Discovery

- API catalog: ${absoluteUrl(API_CATALOG_PATH)}
- OpenAPI description: ${absoluteUrl(OPENAPI_PATH)}
- Agent skills index: ${absoluteUrl(AGENT_SKILLS_INDEX_PATH)}
- MCP server card: ${absoluteUrl(MCP_SERVER_CARD_PATH)}
- Authentication notes: ${absoluteUrl(AUTH_MD_PATH)}

## Public endpoints

### GET /health

Returns service health:

\`\`\`json
{"ok": true}
\`\`\`

## Private operational endpoints

The cron endpoints are for the deployment operator only. They require:

\`\`\`http
Authorization: Bearer <CRON_SECRET>
\`\`\`

These endpoints are not part of a public OAuth/OIDC flow and should not be used by third-party agents.

- \`GET /api/cron/status\` reads the persisted model-cache status.
- \`POST /api/cron/refresh\` refreshes cached model data.
`;

export const authMarkdown = `# ${SITE_NAME} agent authentication

BenchSift's public pages, benchmark pages, API catalog, OpenAPI description, and agent skill documents are available without authentication.

BenchSift does not currently offer public agent registration, OAuth/OIDC login, dynamic client registration, or third-party API tokens.

The \`/api/cron/*\` endpoints are private deployment operations protected by a non-delegable \`CRON_SECRET\` bearer token. They are intended only for the site operator and are not available to external agents.
`;

export const homepageMarkdown = `# ${SITE_NAME}

${DEFAULT_DESCRIPTION}

BenchSift helps compare AI models by intelligence, coding, math, speed, latency, context windows, pricing, and modality support.

## Main pages

- Homepage: ${absoluteUrl("/")}
- Compare models: ${absoluteUrl("/compare")}
- Coding agents leaderboard: ${absoluteUrl("/agents/coding")}
- DeepSWE benchmark: ${absoluteUrl("/benchmarks/deepswe")}

## Agent discovery

- API catalog: ${absoluteUrl(API_CATALOG_PATH)}
- OpenAPI description: ${absoluteUrl(OPENAPI_PATH)}
- API documentation: ${absoluteUrl(API_DOCS_PATH)}
- Agent skills index: ${absoluteUrl(AGENT_SKILLS_INDEX_PATH)}
- MCP server card: ${absoluteUrl(MCP_SERVER_CARD_PATH)}
- Authentication notes: ${absoluteUrl(AUTH_MD_PATH)}

## Authentication

Public model and benchmark pages do not require authentication. Private cron endpoints are reserved for the site operator and require \`CRON_SECRET\`.
`;

export function markdownTokenEstimate(markdown: string): string {
  return Math.ceil(markdown.trim().split(/\s+/).length * 1.35).toString();
}

export interface AgentSkill {
  slug: string;
  name: string;
  type: "navigation" | "information";
  description: string;
  content: string;
}

export const agentSkills: AgentSkill[] = [
  {
    slug: "search-models",
    name: "Search AI models",
    type: "navigation",
    description:
      "Find AI model pages on BenchSift by model name, provider, or visible benchmark metadata.",
    content: `# Search AI models

Use BenchSift's homepage search to find model cards by model name, provider, context, speed, pricing, or visible benchmark metadata.

Useful entrypoints:

- Homepage: ${absoluteUrl("/")}
- Compare models: ${absoluteUrl("/compare")}

Suggested agent flow:

1. Open the homepage.
2. Search for the model or provider.
3. Follow the matching \`/models/{slug}\` link for detailed pricing, speed, benchmark, and capability data.
`,
  },
  {
    slug: "compare-models",
    name: "Compare models",
    type: "navigation",
    description:
      "Open the comparison workspace for side-by-side AI model evaluation.",
    content: `# Compare models

BenchSift exposes a comparison workspace for side-by-side model evaluation.

Entrypoint: ${absoluteUrl("/compare")}

Use this when an agent needs to compare pricing, speed, latency, context windows, and benchmark scores across multiple AI models.
`,
  },
  {
    slug: "coding-benchmarks",
    name: "Inspect coding benchmarks",
    type: "information",
    description:
      "Inspect coding-agent and DeepSWE benchmark leaderboards exposed by BenchSift.",
    content: `# Inspect coding benchmarks

BenchSift exposes coding-oriented benchmark pages for agent and software-engineering model evaluation.

Entrypoints:

- Coding agents: ${absoluteUrl("/agents/coding")}
- DeepSWE: ${absoluteUrl("/benchmarks/deepswe")}

Use these pages when an agent needs coding-specific rankings rather than general model rankings.
`,
  },
];

export function getAgentSkill(slug: string): AgentSkill | undefined {
  return agentSkills.find((skill) => skill.slug === slug);
}
