create extension if not exists vector;

create type public.project_phase as enum ('existing', 'concept', 'design', 'planned', 'in_progress', 'complete', 'archived');
create type public.scenario_state as enum ('draft', 'active', 'archived');
create type public.media_type as enum ('photo', 'video', 'drone', 'receipt', 'render', 'glb', 'scan', 'document');

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  acreage numeric(8, 2),
  location_label text,
  public_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.land_scene_objects (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  zone_key text not null,
  title text not null,
  object_type text not null,
  phase public.project_phase not null default 'concept',
  transform jsonb not null default '{"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1]}'::jsonb,
  material text not null default 'default',
  status text not null default 'Draft',
  cost_range text,
  revenue_role text,
  summary text not null default '',
  steps text[] not null default '{}',
  ai_prompts text[] not null default '{}',
  public_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, zone_key)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  zone_key text not null,
  title text not null,
  phase public.project_phase not null default 'concept',
  priority text not null default 'P2',
  status text not null default 'Draft',
  next_step text,
  estimated_cost numeric(12, 2) not null default 0,
  actual_cost numeric(12, 2) not null default 0,
  projected_annual_revenue numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  owner_label text,
  status text not null default 'todo',
  due_date date,
  display_order integer not null default 0,
  dependencies uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  vendor text,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  spent_on date not null default current_date,
  receipt_path text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.revenue (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  source text not null,
  booking_date date,
  amount numeric(12, 2) not null check (amount >= 0),
  platform text,
  payout_status text not null default 'projected',
  notes text,
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  zone_key text,
  media_type public.media_type not null,
  storage_path text not null,
  title text not null,
  description text,
  captured_at timestamptz,
  season text,
  public_visible boolean not null default false,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table public.scenario_versions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  title text not null,
  state public.scenario_state not null default 'draft',
  prompt text not null,
  change_summary text not null default '',
  estimated_impact text,
  scene_patch jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.model_versions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  source_media_ids uuid[] not null default '{}',
  storage_path text,
  notes text,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.properties enable row level security;
alter table public.land_scene_objects enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.expenses enable row level security;
alter table public.revenue enable row level security;
alter table public.media_assets enable row level security;
alter table public.scenario_versions enable row level security;
alter table public.model_versions enable row level security;

create or replace function public.owns_property(target_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties
    where id = target_property_id
      and owner_id = auth.uid()
  );
$$;

create policy "public can read visible properties"
on public.properties for select
using (public_visible = true or owner_id = auth.uid());

create policy "owners manage properties"
on public.properties for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "public can read visible scene objects"
on public.land_scene_objects for select
using (
  public_visible = true
  or public.owns_property(property_id)
);

create policy "owners manage scene objects"
on public.land_scene_objects for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

create policy "owners manage projects"
on public.projects for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

create policy "owners manage tasks"
on public.tasks for all
using (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and public.owns_property(p.property_id)
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and public.owns_property(p.property_id)
  )
);

create policy "owners manage expenses"
on public.expenses for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

create policy "owners manage revenue"
on public.revenue for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

create policy "public can read visible media"
on public.media_assets for select
using (
  public_visible = true
  or public.owns_property(property_id)
);

create policy "owners manage media"
on public.media_assets for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

create policy "owners manage scenario versions"
on public.scenario_versions for all
using (property_id is null or public.owns_property(property_id) or created_by = auth.uid())
with check (property_id is null or public.owns_property(property_id) or created_by = auth.uid());

create policy "owners manage model versions"
on public.model_versions for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

create index land_scene_objects_property_zone_idx on public.land_scene_objects(property_id, zone_key);
create index projects_property_idx on public.projects(property_id);
create index expenses_property_date_idx on public.expenses(property_id, spent_on desc);
create index revenue_property_date_idx on public.revenue(property_id, booking_date desc);
create index media_assets_property_zone_idx on public.media_assets(property_id, zone_key);
create index scenario_versions_property_state_idx on public.scenario_versions(property_id, state, created_at desc);
create index media_assets_embedding_idx on public.media_assets using ivfflat (embedding vector_cosine_ops) with (lists = 100);

insert into storage.buckets (id, name, public)
values
  ('property-media', 'property-media', false),
  ('public-renders', 'public-renders', true)
on conflict (id) do nothing;
