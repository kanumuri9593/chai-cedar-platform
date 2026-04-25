do $$
begin
  create type public.financial_direction as enum ('investment', 'expense', 'revenue', 'transfer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('planned', 'due', 'paid', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  trade text not null,
  phone text,
  email text,
  company text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  contractor_id uuid references public.contractors(id) on delete set null,
  direction public.financial_direction not null,
  category text not null,
  title text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  transaction_date date not null default current_date,
  payment_method text,
  paid_to text,
  paid_by text,
  invoice_number text,
  receipt_path text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contractor_payments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  transaction_id uuid references public.financial_transactions(id) on delete set null,
  title text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  due_date date,
  paid_date date,
  status public.payment_status not null default 'planned',
  scope_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  contractor_id uuid references public.contractors(id) on delete set null,
  title text not null,
  milestone_date date,
  status text not null default 'planned',
  budget_amount numeric(12, 2) not null default 0,
  actual_amount numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contractors enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.contractor_payments enable row level security;
alter table public.project_milestones enable row level security;

drop policy if exists "owners manage contractors" on public.contractors;
create policy "owners manage contractors"
on public.contractors for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

drop policy if exists "owners manage financial transactions" on public.financial_transactions;
create policy "owners manage financial transactions"
on public.financial_transactions for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

drop policy if exists "owners manage contractor payments" on public.contractor_payments;
create policy "owners manage contractor payments"
on public.contractor_payments for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

drop policy if exists "owners manage project milestones" on public.project_milestones;
create policy "owners manage project milestones"
on public.project_milestones for all
using (public.owns_property(property_id))
with check (public.owns_property(property_id));

create index if not exists contractors_property_idx on public.contractors(property_id, active);
create index if not exists financial_transactions_property_date_idx on public.financial_transactions(property_id, transaction_date desc);
create index if not exists financial_transactions_direction_idx on public.financial_transactions(property_id, direction);
create index if not exists contractor_payments_property_status_idx on public.contractor_payments(property_id, status, due_date);
create index if not exists project_milestones_property_date_idx on public.project_milestones(property_id, milestone_date);
