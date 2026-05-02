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
- **AI**: OpenAI GPT-4o-mini via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)
- **Payments**: Stripe (npm package directly — NOT Replit connector, user dismissed it)
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod validators)
- **Build**: esbuild (server bundle)
- **Routing**: Wouter
- **PDF export**: jsPDF

## Artifacts

| Name | Dir | Path | Description |
|------|-----|------|-------------|
| API Server | `artifacts/api-server` | `/api` | Express backend, Clerk auth, OpenAI scripts CRUD, Stripe checkout |
| ViralScript AI | `artifacts/viral-script` | `/` | React frontend, landing + dashboard + generate pages |

## Libraries

| Package | Description |
|---------|-------------|
| `lib/api-spec` | OpenAPI spec + Orval codegen config |
| `lib/api-zod` | Generated Zod validators from OpenAPI spec |
| `lib/api-client-react` | Generated React Query hooks from OpenAPI spec |
| `lib/db` | Drizzle schema + DB client (`scriptsTable`, `usersTable`) |
| `lib/integrations-openai-ai-server` | OpenAI client for server (Replit AI Integrations) |

## DB Schema

### `scriptsTable`
- `id` — serial PK
- `userId` — text (Clerk user ID)
- `topic` — text
- `targetAudience` — text (e.g. "Entrepreneurs aged 25-35")
- `tone` — text enum (Funny | Professional | Aggressive | Hype | Inspirational | Educational | Storytelling)
- `platform` — text ("TikTok" | "Instagram" | "YouTube")
- `title` — text
- `hook` — text (GPT-structured: attention-grabbing opener)
- `body` — text (GPT-structured: main content with stage directions)
- `callToAction` — text (GPT-structured: closing CTA)
- `script` — text (combined hook+body+CTA for backwards compat / copy-all)
- `hookLab` — text[] (5 alternate opening hooks)
- `aiReasoning` — text (GPT explanation of why the script will perform)
- `hashtags` — text[]
- `createdAt` — timestamp

### `usersTable`
- `id` — text PK (Clerk user ID)
- `email` — text (nullable)
- `isPro` — boolean (default false)
- `scriptsRemaining` — integer (default 3, free tier limit)
- `stripeCustomerId` — text (nullable)
- `stripeSubscriptionId` — text (nullable)
- `createdAt` — timestamp

## API Routes

All under `/api`:
- `GET /api/healthz` — health check
- `GET /api/scripts` — list user's scripts (auth required)
- `POST /api/scripts` — generate script via GPT-4o-mini (auth required, checks quota)
- `GET /api/scripts/stats` — script stats (auth required)
- `GET /api/scripts/:id` — get single script (auth required)
- `DELETE /api/scripts/:id` — delete script (auth required)
- `GET /api/user/profile` — get user profile: isPro, scriptsRemaining (auth required)
- `POST /api/user/checkout` — create Stripe checkout session (auth required)
- `POST /api/user/stripe-webhook` — Stripe webhook handler (no auth)

## Free Tier Logic

- New users get 3 free script generations (`scriptsRemaining = 3`)
- Each generation deducts 1 from `scriptsRemaining`
- At 0 remaining, POST /api/scripts returns 402 with `code: "LIMIT_REACHED"`
- Frontend shows upgrade modal on 402
- Pro users (`isPro = true`) have `scriptsRemaining = 999999` (unlimited)

## Stripe Setup (REQUIRED for payments to work)

The Replit Stripe connector was dismissed. Stripe is integrated via the `stripe` npm package directly.

**Required secrets** (add via Replit Secrets):
- `STRIPE_SECRET_KEY` — Stripe secret key (sk_live_... or sk_test_...)
- `STRIPE_PRICE_ID` — Stripe Price ID for the $19/mo subscription (price_...)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (whsec_...)
- `APP_BASE_URL` — production app URL for Stripe redirect (e.g. https://yourapp.replit.app)

**Stripe webhook events to handle**: `checkout.session.completed`, `customer.subscription.deleted`

Without these secrets, the checkout button returns a 503 with a clear error message — nothing breaks.

## Frontend Pages

- `/` — Landing page (public, hero + features + pricing + testimonials)
- `/dashboard` — Glassmorphism UI, trending topics ticker, script history grid (platform icon + tone badge + Hook Lab/AI Insight indicators), stats, search/filter, detail modal with Hook Lab + AI Reasoning expandable sections, PDF, copy-all, upgrade banner
- `/generate` — "Viral Strategy Studio": structured form (Topic + Target Audience + Tone grid), platform cards, generate button with glow pulse, result panel with Hook Lab (5 alternate hooks, each copyable), AI Strategy Reasoning panel, copy per-section, copy-all, PDF, recent history reload panel, free limit counter, upgrade modal
- `/sign-in` — Clerk sign-in
- `/sign-up` — Clerk sign-up

## CSS Utilities (index.css)
- `.glass` — backdrop-blur-md glassmorphism panel
- `.glass-strong` — stronger glass for modals
- `.glass-card` — hoverable glass card
- `.ticker-track` — animated trending topics ticker
- `.btn-glow` — pulsing purple glow on the generate button
- `.hook-card` — shimmer hover effect for Hook Lab items

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Important Notes

- Orval regenerates `lib/api-zod/src/index.ts` on each codegen run. The codegen script post-processes this to `export * from "./generated/api"` only.
- Clerk proxy middleware is set up in `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts`.
- OpenAI model: `gpt-4o-mini` via Replit AI Integrations.
- Raw body capture for Stripe webhook is done before `express.json()` middleware for the `/api/user/stripe-webhook` path.
- Auth uses `@clerk/react@^6` on frontend and `@clerk/express` on backend.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
