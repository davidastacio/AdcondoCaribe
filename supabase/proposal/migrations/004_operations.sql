-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT APPROVAL.
create table public.visit_recurrences (
 id uuid primary key default gen_random_uuid(), tower_id uuid not null references public.towers(id),
 supervisor_id uuid not null references public.users(id), checklist_template_id uuid references public.checklist_templates(id),
 frequency public.recurrence_frequency not null, start_date date not null, end_date date, scheduled_time time not null,
 day_of_week smallint check(day_of_week between 0 and 6), active boolean not null default true,
 created_by_id uuid not null references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index visit_recurrences_supervisor_idx on public.visit_recurrences(supervisor_id,active);
create trigger visit_recurrences_updated_at before update on public.visit_recurrences for each row execute function app.set_updated_at();

create table public.visits (
 id uuid primary key default gen_random_uuid(), code text not null unique, tower_id uuid not null references public.towers(id),
 supervisor_id uuid not null references public.users(id), checklist_template_id uuid references public.checklist_templates(id),
 recurrence_id uuid references public.visit_recurrences(id), status public.visit_status not null default 'SCHEDULED',
 scheduled_date date not null, scheduled_time time not null, estimated_duration_minutes integer not null default 60 check(estimated_duration_minutes>0),
 visit_type_id uuid references public.catalog_items(id), priority public.priority, notes text,
 started_at timestamptz, started_by_id uuid references public.users(id), completed_at timestamptz, completed_by_id uuid references public.users(id),
 cancelled_at timestamptz, cancelled_by_id uuid references public.users(id), cancellation_reason text,
 created_by_id uuid not null references public.users(id), updated_by_id uuid references public.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index visits_supervisor_date_idx on public.visits(supervisor_id,scheduled_date);
create index visits_tower_date_idx on public.visits(tower_id,scheduled_date);
create index visits_status_date_idx on public.visits(status,scheduled_date);
create trigger visits_updated_at before update on public.visits for each row execute function app.set_updated_at();

create table public.visit_schedule_history (
 id uuid primary key default gen_random_uuid(), visit_id uuid not null references public.visits(id),
 previous_date date, previous_time time, new_date date not null, new_time time not null, reason text not null,
 changed_by_id uuid not null references public.users(id), created_at timestamptz not null default now()
);
create index visit_schedule_history_visit_idx on public.visit_schedule_history(visit_id,created_at);

create table public.inspections (
 id uuid primary key default gen_random_uuid(), visit_id uuid not null unique references public.visits(id),
 template_id uuid not null references public.checklist_templates(id), template_version integer not null, template_snapshot jsonb not null,
 status public.inspection_status not null default 'NOT_STARTED', progress smallint not null default 0 check(progress between 0 and 100),
 started_at timestamptz, completed_at timestamptz, overall_condition public.answer_condition,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index inspections_status_idx on public.inspections(status);
create trigger inspections_updated_at before update on public.inspections for each row execute function app.set_updated_at();

create table public.inspection_answers (
 id uuid primary key default gen_random_uuid(), inspection_id uuid not null references public.inspections(id),
 item_id uuid not null references public.checklist_items(id), condition public.answer_condition not null,
 observation text, responsible text, material_needed text, priority public.priority,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(inspection_id,item_id)
);
create trigger inspection_answers_updated_at before update on public.inspection_answers for each row execute function app.set_updated_at();
create table public.inspection_photos (
 id uuid primary key default gen_random_uuid(), inspection_id uuid not null references public.inspections(id),
 answer_id uuid references public.inspection_answers(id), storage_key text not null unique, mime_type text,
 latitude numeric(10,7), longitude numeric(10,7), uploaded_by_id uuid not null references public.users(id),
 deleted_at timestamptz, deleted_by_id uuid references public.users(id), created_at timestamptz not null default now()
);
create index inspection_photos_inspection_idx on public.inspection_photos(inspection_id,created_at);

create table public.incidents (
 id uuid primary key default gen_random_uuid(), code text not null unique, tower_id uuid not null references public.towers(id),
 visit_id uuid references public.visits(id), inspection_id uuid references public.inspections(id), answer_id uuid references public.inspection_answers(id),
 reported_by_id uuid not null references public.users(id), assigned_to_id uuid references public.users(id),
 area_id uuid references public.catalog_items(id), category_id uuid references public.catalog_items(id),
 title text not null, description text not null, priority public.priority not null, status public.incident_status not null default 'OPEN',
 resolution text, resolved_at timestamptz, resolved_by_id uuid references public.users(id), closed_at timestamptz, closed_by_id uuid references public.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index incidents_tower_created_idx on public.incidents(tower_id,created_at);
create index incidents_status_priority_idx on public.incidents(status,priority);
create trigger incidents_updated_at before update on public.incidents for each row execute function app.set_updated_at();
create table public.incident_updates (
 id uuid primary key default gen_random_uuid(), incident_id uuid not null references public.incidents(id), user_id uuid not null references public.users(id),
 type public.incident_update_type not null, comment text, old_status public.incident_status, new_status public.incident_status,
 is_internal boolean not null default false, created_at timestamptz not null default now()
);
create index incident_updates_incident_idx on public.incident_updates(incident_id,created_at);
create table public.incident_photos (
 id uuid primary key default gen_random_uuid(), incident_id uuid not null references public.incidents(id), incident_update_id uuid references public.incident_updates(id),
 storage_key text not null unique, type public.incident_photo_type not null default 'GENERAL', uploaded_by_id uuid not null references public.users(id),
 deleted_at timestamptz, deleted_by_id uuid references public.users(id), created_at timestamptz not null default now()
);

