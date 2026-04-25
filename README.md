# Chai & Cedar Platform

Interactive 3D public website plus private planning cockpit for the first Chai & Cedar property.

## Stack

- Next.js, React, TypeScript
- Three.js / React Three Fiber / Drei
- Framer Motion
- Supabase Auth, Postgres, Storage, Edge Functions, pgvector

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app runs in demo mode without Supabase credentials. To connect Supabase:

```bash
cp .env.local.example .env.local
```

Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://bkvggutxgjeqsvxwkanu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_OWNER_PASSWORD=cedar2026
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

## Supabase Setup

Apply the migration in `supabase/migrations/20260425130000_chai_cedar_platform.sql`.
Then apply `supabase/migrations/20260425143000_finance_contractor_tracking.sql`.

CLI setup for project `bkvggutxgjeqsvxwkanu`:

```bash
npx supabase login
npx supabase link --project-ref bkvggutxgjeqsvxwkanu
npx supabase db push
```

GitHub Pages needs the public anon key at build time:

```bash
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo kanumuri9593/chai-cedar-platform
```

The Supabase project URL secret is already:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://bkvggutxgjeqsvxwkanu.supabase.co
```

Set the shared owner password for the lightweight dashboard gate:

```bash
gh secret set NEXT_PUBLIC_OWNER_PASSWORD --repo kanumuri9593/chai-cedar-platform
```

This is convenience-only protection for a static/public build. Keep Supabase RLS enabled for real cloud writes.

It creates:

- `properties`
- `land_scene_objects`
- `projects`
- `tasks`
- `expenses`
- `revenue`
- `contractors`
- `financial_transactions`
- `contractor_payments`
- `project_milestones`
- `media_assets`
- `scenario_versions`
- `model_versions`
- RLS policies for owner-only writes
- public read policies for approved visible data
- storage buckets for private property media and public renders
- `pgvector` support for semantic search

The Edge Function at `supabase/functions/propose-scene-change` stores AI-generated proposals as drafts only. It does not publish scene changes automatically.

## Product Shape

- `/` is the public cinematic 3D Chai & Cedar experience.
- `/dashboard` is the private operating cockpit.
- Scene objects are represented as structured records so future AI/chat commands can draft changes like moving structures, changing materials, adding amenities, and creating seasonal versions.
