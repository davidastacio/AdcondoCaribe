-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT APPROVAL.
create table public.towers (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 type public.tower_type not null default 'TOWER', address text not null, sector text, city text, province text,
 location_reference text, floors integer, apartments integer, parking_spaces integer, elevators integer,
 year_built integer, blocks integer, has_pool boolean not null default false, has_gym boolean not null default false,
 has_social_area boolean not null default false, has_generator boolean not null default false,
 has_elevators boolean not null default false, has_cameras boolean not null default false,
 has_water_tank boolean not null default false, has_pumps boolean not null default false,
 status public.tower_status not null default 'ACTIVE', notes text,
 created_by_id uuid references public.users(id), updated_by_id uuid references public.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index towers_status_name_idx on public.towers(status,name);
create trigger towers_updated_at before update on public.towers for each row execute function app.set_updated_at();

create table public.tower_contacts (
 id uuid primary key default gen_random_uuid(), tower_id uuid not null references public.towers(id),
 type text not null, name text not null, phone text, email text, notes text, active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index tower_contacts_tower_idx on public.tower_contacts(tower_id);
create trigger tower_contacts_updated_at before update on public.tower_contacts for each row execute function app.set_updated_at();

create table public.tower_photos (
 id uuid primary key default gen_random_uuid(), tower_id uuid not null references public.towers(id),
 storage_key text not null unique, uploaded_by_id uuid not null references public.users(id),
 deleted_at timestamptz, deleted_by_id uuid references public.users(id), created_at timestamptz not null default now()
);

create table public.tower_assignments (
 id uuid primary key default gen_random_uuid(), tower_id uuid not null references public.towers(id),
 supervisor_id uuid not null references public.users(id), assigned_by_id uuid not null references public.users(id),
 status public.assignment_status not null default 'ACTIVE', start_date date not null, end_date date,
 ended_by_id uuid references public.users(id), notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((status='ACTIVE' and end_date is null) or status<>'ACTIVE')
);
create unique index tower_assignments_active_uq on public.tower_assignments(tower_id,supervisor_id) where status='ACTIVE';
create index tower_assignments_supervisor_idx on public.tower_assignments(supervisor_id,status);
create index tower_assignments_tower_idx on public.tower_assignments(tower_id,status);
create trigger tower_assignments_updated_at before update on public.tower_assignments for each row execute function app.set_updated_at();

create or replace function app.enforce_supervisor_assignment() returns trigger language plpgsql
set search_path=pg_catalog,public as $$ begin
 if not exists(select 1 from public.users where id=new.supervisor_id and role='SUPERVISOR') then
   raise exception 'supervisor_id must reference a SUPERVISOR user';
 end if; return new; end $$;
create trigger tower_assignments_supervisor_ck before insert or update of supervisor_id on public.tower_assignments
for each row execute function app.enforce_supervisor_assignment();

create table public.checklist_templates (
 id uuid primary key default gen_random_uuid(), name text not null, description text, version integer not null default 1,
 active boolean not null default true, created_by_id uuid not null references public.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(name,version)
);
create trigger checklist_templates_updated_at before update on public.checklist_templates for each row execute function app.set_updated_at();
create table public.checklist_sections (
 id uuid primary key default gen_random_uuid(), template_id uuid not null references public.checklist_templates(id),
 name text not null, description text, required boolean not null default true, active boolean not null default true,
 sort_order integer not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(template_id,sort_order)
);
create trigger checklist_sections_updated_at before update on public.checklist_sections for each row execute function app.set_updated_at();
create table public.checklist_items (
 id uuid primary key default gen_random_uuid(), section_id uuid not null references public.checklist_sections(id),
 name text not null, description text, required boolean not null default true, requires_inventory_check boolean not null default false,
 active boolean not null default true, sort_order integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(section_id,sort_order)
);
create trigger checklist_items_updated_at before update on public.checklist_items for each row execute function app.set_updated_at();

