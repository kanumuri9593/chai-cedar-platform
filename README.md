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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

## Supabase Setup

Apply the migration in `supabase/migrations/20260425130000_chai_cedar_platform.sql`.

It creates:

- `properties`
- `land_scene_objects`
- `projects`
- `tasks`
- `expenses`
- `revenue`
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
