# NaturHome Hub — Family Home Management App

## Overview

A full-stack family home management app centered around an AI assistant. Built on a pnpm monorepo with TypeScript throughout.

## Features

- **AI Assistant (primary)** — streaming chat with markdown responses, auto-named conversations, search, date/time stamps, inline widget on dashboard
- **Dashboard** — AI quick-chat widget front-and-center, compact summary cards for events/tasks/meals
- **Calendar** — monthly + weekly view, events color-coded by assigned family member, member legend strip with event counts, filter by member
- **Tasks** — task list with priority, due dates, status tracking, family assignment
- **Meal Planning** — weekly meal grid (breakfast/lunch/dinner/snack per day)
- **Family Members** — manage family profiles with colors and avatars
- **Auth** — Replit-managed Clerk Auth (email + Google sign-in)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite + Tailwind v4 + shadcn/ui + Wouter routing
- **Markdown**: react-markdown + remark-gfm (AI responses)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (contract-first from OpenAPI spec)
- **Auth**: Clerk (Replit-managed, `@clerk/react` + `@clerk/express`)
- **AI**: Replit OpenAI integration (`@workspace/integrations-openai-ai-server`), model gpt-5.4

## Artifacts

| Artifact | Path | Port |
|---|---|---|
| `home-planner` | `/` | $PORT (20474) |
| `api-server` | `/api` | 8080 |

## Packages

```
artifacts/
  api-server/       — Express 5 REST API with Clerk auth
  home-planner/     — React + Vite SPA

lib/
  api-spec/         — OpenAPI YAML + Orval codegen config
  api-client-react/ — Generated TanStack Query hooks (from Orval)
  api-zod/          — Generated Zod schemas (from Orval)
  db/               — Drizzle ORM schema + migrations
  integrations-openai-ai-server/ — OpenAI client + batch utils (server)
  integrations-openai-ai-react/  — Voice/audio hooks (react)
```

## DB Schema

- `family_members` — id, userId, name, role, color (HSL string), avatarInitials
- `calendar_events` — id, userId, title, description, startTime, endTime, allDay, location, familyMemberId, color, category
- `tasks` — id, userId, title, notes, completed, dueDate, priority, familyMemberId, category
- `meals` — id, userId, date, mealType, name, notes, ingredients
- `conversations` — id, userId, title (auto-generated), createdAt, updatedAt
- `messages` — id, conversationId, role, content, createdAt

## Navigation

- **Desktop**: Sidebar with AI at top (Sparkles icon), floating "Ask AI" pill button on all non-AI pages
- **Mobile**: Bottom tab bar (AI, Calendar, Tasks, Meals, More), compact header with app name + UserButton

## AI System Prompt

The AI is instructed to use markdown formatting for all responses (headers, bullet lists, bold text) for scannability. Auto-names conversations after the first exchange using a quick secondary API call.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Notes

- All API routes require Clerk auth via `requireAuth` middleware
- AI chat uses SSE streaming — frontend handles raw `fetch` + `ReadableStream`
- CSS uses space-separated HSL values: `--primary: 220 70% 50%` (no `hsl()` wrapper)
- No emojis anywhere in the UI
- Do NOT import React explicitly — Vite JSX transformer handles it
- Use Orval-generated hooks from `@workspace/api-client-react` for all API calls
- Google Calendar integration is a roadmap item — requires OAuth setup
