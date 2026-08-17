-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT APPROVAL.
create table public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique,
  email text not null unique,
  first_name text not null,
  last_name text not null,
  phone text,
  avatar_storage_key text,
  job_title text,
  employee_code text unique,
  role public.app_role not null,
  status public.user_status not null default 'PENDING',
  notes text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_active_identity_ck check (status <> 'ACTIVE' or firebase_uid is not null)
);
create index users_role_status_idx on public.users(role,status);
create trigger users_updated_at before update on public.users for each row execute function app.set_updated_at();

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  catalog_type text not null,
  code text not null,
  label text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(catalog_type,code)
);
create index catalog_items_lookup_idx on public.catalog_items(catalog_type,active,sort_order);
create trigger catalog_items_updated_at before update on public.catalog_items for each row execute function app.set_updated_at();

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger system_settings_updated_at before update on public.system_settings for each row execute function app.set_updated_at();

-- These helpers trust only transaction-local claims set by the verified server path.
create or replace function app.firebase_uid() returns text
language sql stable security invoker set search_path = pg_catalog as $$
  select nullif(current_setting('request.jwt.claim.firebase_uid', true), '')
$$;
create or replace function app.current_user_id() returns uuid
language sql stable security definer set search_path = pg_catalog, public as $$
  select id from public.users where firebase_uid = app.firebase_uid() and status = 'ACTIVE'
$$;
create or replace function app.is_admin() returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(select 1 from public.users where id=app.current_user_id() and role='ADMIN' and status='ACTIVE')
$$;
create or replace function app.is_supervisor() returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(select 1 from public.users where id=app.current_user_id() and role='SUPERVISOR' and status='ACTIVE')
$$;
revoke all on function app.current_user_id() from public;
revoke all on function app.is_admin() from public;
revoke all on function app.is_supervisor() from public;

