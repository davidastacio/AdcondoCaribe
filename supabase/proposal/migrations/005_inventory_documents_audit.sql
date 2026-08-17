-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT APPROVAL.
create table public.inventory_items (
 id uuid primary key default gen_random_uuid(), name text not null, category_id uuid not null references public.catalog_items(id),
 unit_id uuid not null references public.catalog_items(id), active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index inventory_items_active_name_idx on public.inventory_items(active,name);
create trigger inventory_items_updated_at before update on public.inventory_items for each row execute function app.set_updated_at();
create table public.tower_inventory (
 id uuid primary key default gen_random_uuid(), tower_id uuid not null references public.towers(id),
 inventory_item_id uuid not null references public.inventory_items(id), quantity numeric(12,2) not null default 0 check(quantity>=0),
 recommended_quantity numeric(12,2) check(recommended_quantity is null or recommended_quantity>=0), location text, observation text,
 stock_status public.stock_status not null default 'NOT_VERIFIED', last_checked_by_id uuid references public.users(id), last_checked_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tower_id,inventory_item_id)
);
create index tower_inventory_status_idx on public.tower_inventory(stock_status);
create trigger tower_inventory_updated_at before update on public.tower_inventory for each row execute function app.set_updated_at();
create table public.inventory_photos (
 id uuid primary key default gen_random_uuid(), tower_inventory_id uuid not null references public.tower_inventory(id),
 storage_key text not null unique, latitude numeric(10,7), longitude numeric(10,7), uploaded_by_id uuid not null references public.users(id),
 deleted_at timestamptz, deleted_by_id uuid references public.users(id), created_at timestamptz not null default now()
);

create table public.material_requests (
 id uuid primary key default gen_random_uuid(), code text not null unique, visit_id uuid references public.visits(id),
 tower_id uuid not null references public.towers(id), requested_by_id uuid not null references public.users(id),
 status public.request_status not null default 'DRAFT', notes text, rejection_reason text,
 approved_at timestamptz, approved_by_id uuid references public.users(id), purchased_at timestamptz, purchased_by_id uuid references public.users(id),
 delivered_at timestamptz, delivered_by_id uuid references public.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index material_requests_requester_idx on public.material_requests(requested_by_id,status);
create index material_requests_tower_idx on public.material_requests(tower_id,created_at);
create trigger material_requests_updated_at before update on public.material_requests for each row execute function app.set_updated_at();
create table public.material_request_items (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.material_requests(id),
 inventory_item_id uuid not null references public.inventory_items(id), current_quantity numeric(12,2) not null default 0,
 requested_quantity numeric(12,2) not null check(requested_quantity>0), observation text, unique(request_id,inventory_item_id)
);
create table public.material_request_updates (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.material_requests(id), user_id uuid not null references public.users(id),
 old_status public.request_status, new_status public.request_status not null, comment text, created_at timestamptz not null default now()
);
create index material_request_updates_request_idx on public.material_request_updates(request_id,created_at);

create table public.documents (
 id uuid primary key default gen_random_uuid(), tower_id uuid references public.towers(id), category_id uuid references public.catalog_items(id),
 name text not null, storage_key text not null unique, mime_type text, size_bytes bigint check(size_bytes is null or size_bytes>=0), description text,
 status public.document_status not null default 'ACTIVE', document_date date, uploaded_by_id uuid not null references public.users(id),
 deleted_at timestamptz, deleted_by_id uuid references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index documents_tower_idx on public.documents(tower_id,created_at);
create trigger documents_updated_at before update on public.documents for each row execute function app.set_updated_at();
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id), title text not null, body text not null,
 entity_type text, entity_id uuid, read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_user_read_idx on public.notifications(user_id,read_at);
create table public.activity_logs (
 id uuid primary key default gen_random_uuid(), actor_user_id uuid references public.users(id), tower_id uuid references public.towers(id),
 action text not null, entity_type text not null, entity_id uuid, metadata jsonb, ip_address inet, user_agent text,
 created_at timestamptz not null default now()
);
create index activity_logs_entity_idx on public.activity_logs(entity_type,entity_id,created_at);
create index activity_logs_tower_idx on public.activity_logs(tower_id,created_at);

