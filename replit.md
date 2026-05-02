# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack Micro-SaaS app **ViralScript AI** — AI-powered viral video script generator.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind v4 (dark mode, Supabase-style UI)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **Auth**: Clerk (Google + email/password) via `@clerk/react@^6` + `@clerk/express`
- **AI**: OpenAI GPT via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod validators)
- **Build**: esbuild (server bundle)
- **Routing**: Wouter

## Artifacts

| Name | Dir | Path | Description |
|------|-----|------|-------------|
| API Server | `artifacts/api-server` | `/api` | Express backend, Clerk auth, OpenAI scripts CRUD |
| ViralScript AI | `artifacts/viral-script` | `/` | React frontend, landing + dashboard + generate pages |

## Libraries

| Package | Description |
|---------|-------------|
| `lib/api-spec` | OpenAPI spec + Orval codegen config |
| `lib/api-zod` | Generated Zod validators from OpenAPI spec |
| `lib/api-client-react` | Generated React Query hooks from OpenAPI spec |
| `lib/db` | Drizzle schema + DB client (`scriptsTable`) |
| `lib/integrations-openai-ai-server` | OpenAI client for server (Replit AI Integrations) |
| `lib/integrations-openai-ai-react` | OpenAI client for React (unused currently) |

## DB Schema

`scriptsTable` (PostgreSQL):
- `id` — serial PK
- `userId` — text (Clerk user ID)
- `topic` — text
- `platform` — text ("TikTok" | "Instagram" | "YouTube")
- `title` — text
- `script` — text
- `hashtags` — text[]
- `createdAt` — timestamp

## API Routes

All under `/api`:
- `GET /api/healthz` — health check
- `GET /api/scripts` — list user's scripts (auth required)
- `POST /api/scripts` — generate script via OpenAI (auth required)
- `GET /api/scripts/stats` — script stats (auth required)
- `GET /api/scripts/:id` — get single script (auth required)
- `DELETE /api/scripts/:id` — delete script (auth required)

## Frontend Pages

- `/` — Landing page (public, hero + features + pricing teaser + testimonials)
- `/dashboard` — Script history, stats, search/filter, delete (auth required)
- `/generate` — Generate new script (auth required)
- `/sign-in` — Clerk sign-in
- `/sign-up` — Clerk sign-up

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Important Notes

- Orval regenerates `lib/api-zod/src/index.ts` on each codegen run. The codegen script post-processes this to `export * from "./generated/api"` only — do NOT add the types barrel back.
- Clerk proxy middleware is set up in `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` (production-only proxy).
- OpenAI model used: `gpt-5-mini` via Replit AI Integrations base URL.
- Auth uses `@clerk/react@^6` on frontend and `@clerk/express` on backend. `publishableKeyFromHost` comes from `@clerk/react/internal`.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
