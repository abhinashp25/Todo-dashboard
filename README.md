# TASKOPS — Real-Time To-Do Dashboard

A production-grade real-time task dashboard built with **Next.js 14** + **Supabase Realtime**.  
All connected clients update instantly via WebSocket — no polling, no refresh.

![Stack](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Stack](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=flat-square&logo=supabase)
![Stack](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

---

## Features

- **Live WebSocket sync** via Supabase Realtime — changes appear on all clients instantly
- **Inline editing** — click Status, Priority, or Agent cells to update without a form
- **Row flash animation** when a row is updated by any client
- **Filterable table** — search by title/agent, filter by status and priority
- **Stats bar** with live counts and completion percentage bar
- **Add / Delete** tasks with a modal form
- Dark, minimal, monospace UI with glowing status indicators

---

## Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account

---

## 1 — Supabase Setup

### Create a project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**, give it a name, choose a region
3. Wait ~2 minutes for it to provision

### Run the schema

1. In your project sidebar, go to **SQL Editor**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run** (or press `Ctrl+Enter`)

This creates the `todos` table, sets up RLS policies, enables Realtime, and seeds 10 sample tasks.

### Enable Realtime (double-check)

1. Go to **Database → Replication** in the Supabase sidebar
2. Under **Supabase Realtime**, ensure `todos` is toggled ON
3. (The SQL script does this automatically, but verify here)

### Get your API keys

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2 — Local Setup

```bash
# Clone or unzip the project
cd todo-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# → Edit .env.local and paste your Supabase URL + anon key

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 3 — How Realtime Works

```
Browser A                  Supabase Postgres              Browser B
   │                              │                            │
   │── UPDATE todos SET ─────────>│                            │
   │   status='completed'         │──── postgres_changes ─────>│
   │                              │     event (WebSocket)      │
   │                              │                            │── Row flashes green
   │                              │                            │   UI updates instantly
```

The hook `lib/useRealtimeTodos.ts` opens a single Supabase channel:

```typescript
supabase
  .channel("todos-realtime")
  .on("postgres_changes", { event: "*", schema: "public", table: "todos" }, handler)
  .subscribe()
```

Every `INSERT`, `UPDATE`, and `DELETE` from any source (another browser, a script, Supabase Studio, or an AI agent) triggers an instant update across all connected dashboards.

---

## 4 — Simulating Agent Updates

Open the **Supabase SQL Editor** and run:

```sql
-- Simulate an agent completing a task
UPDATE todos
SET status = 'completed', assigned_agent = 'Agent Alpha'
WHERE id = '<paste-a-todo-id>';

-- Or bulk-update all in_progress tasks
UPDATE todos SET status = 'completed' WHERE status = 'in_progress';
```

Watch your dashboard update live without touching the browser.

You can also connect a Python/Node.js AI agent directly to Supabase:

```python
from supabase import create_client

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Agent marks task done
client.table("todos").update({
    "status": "completed",
    "assigned_agent": "Agent GPT-4o"
}).eq("id", task_id).execute()
```

---

## Project Structure

```
todo-dashboard/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # CSS variables, animations, reset
├── components/
│   ├── Badges.tsx          # StatusBadge + PriorityBadge
│   ├── StatsBar.tsx        # Summary counts + progress bar
│   ├── FilterBar.tsx       # Search + status/priority filters
│   ├── TodoRow.tsx         # Table row with inline editing
│   └── AddTodoModal.tsx    # New task modal
├── lib/
│   ├── supabase.ts         # Client, types, DB helpers
│   └── useRealtimeTodos.ts # Realtime hook + state reducer
├── supabase/
│   └── schema.sql          # Table, RLS, realtime, seed data
├── .env.local.example      # Environment variables template
└── README.md
```

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel

# Set env vars in Vercel dashboard or via CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Production Hardening

For a production deployment, consider:

- Replace public RLS policies with **auth-based policies** using `auth.uid()`
- Add **Supabase Auth** (magic link or OAuth) for agent identity
- Use **server actions** for mutations instead of direct client calls
- Add **optimistic updates** for instant local feedback before Supabase confirms
- Set up **Supabase Edge Functions** for agent webhooks
