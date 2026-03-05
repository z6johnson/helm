# Helm

Persistent ambient dashboard for managing AI strategy intake at UC San Diego. Built to live on a dedicated monitor. Next.js on Vercel, backed by ClickUp. Swiss typographic design system.

---

## Overview

Helm surfaces AI project intake requests from a ClickUp list onto a single-page dashboard. The team can monitor request status, edit metadata inline, leave comments, and create new tasks — all without leaving the dashboard. An attention scoring system automatically surfaces requests that need action.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| UI | React 18, SWR |
| Drag-and-drop | @hello-pangea/dnd |
| Cache | Vercel KV (Redis), in-memory fallback for dev |
| Backend | ClickUp REST API v2 |
| Hosting | Vercel |
| Font | Albert Sans (Google Fonts) |

---

## Features

### Dashboard

- **Task grid** — all active intake tasks sorted by due date (soonest first, undated last)
- **Header metrics** — live counts of tasks in New, Scoping, and Resourcing states
- **Manual sync** — "Sync now" button triggers an immediate ClickUp fetch and cache refresh
- **Auto-refresh** — SWR polls `/api/tasks` every 5 minutes in the background
- **Create task** — "+ New Task" button opens an inline form; task is created in ClickUp and appended to the grid immediately (optimistic update)

### Task Tiles

Each task renders as a card with:

- **Inline name editing** — click the title to edit; confirm with Enter, cancel with Escape
- **Status dropdown** — change the ClickUp status from any intake stage (New Requests, Scoping, Resourcing); updates are applied optimistically and written to ClickUp in the background
- **Due date** — displayed next to status; highlighted red when overdue
- **Project Sponsor** — shown as a quick-glance metadata field
- **Comments panel** — expandable section that lazy-loads ClickUp comments on first open; new comments submitted via textarea (Cmd/Ctrl+Enter or button)
- **Open in ClickUp** link — direct link to the source task

### Attention Scoring

Every task is scored 0–100+ to identify requests that need attention. Tasks in the grid are available for sorting by this score. The score is composed of:

| Signal | Points | Trigger |
|---|---|---|
| Staleness | 0–40 | 2 pts per day since last update, capped at 40 |
| Overdue | 30–50 | 30 base + 5 pts per week overdue |
| Due within 7 days | 30 | — |
| Due within 14 days | 20 | — |
| Due within 30 days | 10 | — |
| Missing critical fields | 0–20 | 5 pts per missing field (max 4 fields) |
| New unprocessed request | 10 | Status order index 0, created within 48 hours |

**Critical fields** checked for completeness: Requester Name, Request description, VC Area/Org, Type of Project.

Human-readable reasons are stored alongside the score (e.g., "No activity in 21d", "Overdue by 5d", "2 key fields missing").

### Status Bar

Persistent footer showing:
- Connection indicator dot (syncing / ok / unknown)
- Relative timestamp of last successful sync
- Total task count
- "Sync now" button

### Keyboard Shortcuts

| Shortcut | Context | Action |
|---|---|---|
| `N` | Dashboard (not in input) | Open new task form |
| `Escape` | Anywhere | Cancel / close form |
| `Ctrl/Cmd + Enter` | Create form | Submit the form |
| `Enter` | Editing task name / sponsor | Save |
| `Ctrl/Cmd + Enter` | Comment input | Submit comment |

### Authentication

Single shared-password login. On success, an `httpOnly` cookie (`helm-auth`) is set for 30 days. All pages and API routes (except `/login` and `/api/auth`) are protected by Next.js middleware. Cron endpoints are exempted from cookie auth and validated separately via `CRON_SECRET`.

---

## Custom Fields

Helm reads and displays the following ClickUp custom fields:

| Field | Type |
|---|---|
| VC Area / Org | Dropdown |
| Type of Project | Dropdown |
| Service Line | Dropdown |
| Paid / Unpaid | Dropdown |
| Project Sponsor | Text |
| Requester Name | Short text |
| Requester Email | Email |
| Org Department | Text |
| Project Lead | Text |
| Project Support | Text |
| Request | Long text |
| Objectives | Long text |
| Additional Info | Long text |

Editable field types: `drop_down`, `short_text`, `text`, `email`.

---

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tasks` | Return cached task list; fetches live on cache miss |
| `POST` | `/api/tasks` | Create a new task in ClickUp; updates cache |
| `GET` | `/api/tasks/[id]` | Fetch a single task live from ClickUp |
| `PATCH` | `/api/tasks/[id]` | Update task name, status, or a single custom field; refreshes cache entry |
| `GET` | `/api/tasks/[id]/comments` | Fetch comments for a task |
| `POST` | `/api/tasks/[id]/comments` | Add a comment to a task |
| `GET` | `/api/cron/sync` | Vercel Cron endpoint — full ClickUp sync (requires `CRON_SECRET`) |
| `POST` | `/api/cron/sync` | Manual sync trigger from dashboard UI |
| `POST` | `/api/auth` | Validate password and set auth cookie |

### Sync Behaviour

The sync fetches all tasks in the three active intake statuses (`ai intake new requests`, `ai intake scoping`, `ai intake resourcing`), transforms them, and writes the result to Vercel KV with a 25-hour TTL. Sync retries up to 3 times with exponential backoff (1s, 2s, 4s) on failure. The Vercel Cron job runs daily at 08:00 UTC.

---

## Caching

In production (Vercel KV configured): task payloads are stored in Redis under the key `helm:tasks` with a 25-hour TTL.

In development (no KV env vars): an in-memory map on `globalThis` is used as a fallback with the same TTL semantics.

Cache is invalidated and rebuilt on every manual or scheduled sync.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values.

```
# ClickUp API
CLICKUP_API_TOKEN=pk_...         # Personal API token from ClickUp settings
CLICKUP_LIST_ID=...              # ID of the intake ClickUp list
CLICKUP_USER_ID=...              # Numeric ClickUp user ID; used to filter tasks by assignee/creator

# Dashboard auth (shared password)
DASHBOARD_SECRET=your-secret    # Password shown on the /login page

# Cron job auth (set automatically by Vercel for cron jobs)
CRON_SECRET=...

# Vercel KV (populated automatically by the Vercel KV integration)
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

---

## Local Development

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

Open `http://localhost:3000`. Without Vercel KV env vars the app uses an in-memory cache. Without `CLICKUP_API_TOKEN` all ClickUp calls will throw; set a valid token to load real data.

---

## Deployment

Deploy to Vercel. Attach a **Vercel KV** store to the project — the integration automatically sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Set the remaining environment variables in the Vercel dashboard. The `vercel.json` cron configuration schedules the daily sync automatically.

---

## Project Structure

```
app/
  api/
    auth/route.ts            — password login, sets auth cookie
    cron/sync/route.ts       — scheduled + manual ClickUp sync
    tasks/route.ts           — list tasks (GET) and create task (POST)
    tasks/[id]/route.ts      — fetch/update single task
    tasks/[id]/comments/     — fetch/add comments
  login/page.tsx             — login page
  page.tsx                   — main dashboard
  layout.tsx                 — root layout, font, metadata
  globals.css                — design system + component styles
components/
  TaskGrid.tsx               — grid container, due-date sorting
  TaskTile.tsx               — individual task card with all interactions
  TaskCard.tsx               — compact card variant
  ActivityStream.tsx         — comment thread display
  CommentInput.tsx           — comment composer
  CreateTaskForm.tsx         — inline new-task form
  StatusBar.tsx              — footer sync status bar
  Toast.tsx                  — toast notification system
lib/
  types.ts                   — all TypeScript types + field ID constants
  clickup.ts                 — ClickUp API client functions
  cache.ts                   — Vercel KV / in-memory cache helpers
  transform.ts               — raw ClickUp tasks → DashboardTask
  scoring.ts                 — attention score computation
middleware.ts                — auth protection for all routes
vercel.json                  — cron schedule (daily 08:00 UTC)
```
