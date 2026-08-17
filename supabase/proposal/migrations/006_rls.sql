-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT APPROVAL.
-- Trust boundary: only the Next.js backend may SET ROLE adcondo_server and call begin_verified_request.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='adcondo_server') then
    create role adcondo_server nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
end $$;

revoke all on schema app from public, anon, authenticated;
grant usage on schema app, public to adcondo_server;

create or replace function app.begin_verified_request(p_firebase_uid text) returns uuid
language plpgsql security invoker set search_path=pg_catalog,public,app as $$
declare v_user_id uuid;
begin
  if current_user <> 'adcondo_server' then raise exception 'trusted backend role required' using errcode='42501'; end if;
  if p_firebase_uid is null or length(p_firebase_uid) not between 1 and 128 then raise exception 'invalid verified identity'; end if;
  perform set_config('request.jwt.claim.firebase_uid',p_firebase_uid,true);
  select id into v_user_id from public.users where firebase_uid=p_firebase_uid and status='ACTIVE';
  if v_user_id is null then raise exception 'ADCONDO user is not active' using errcode='42501'; end if;
  return v_user_id;
end $$;
revoke all on function app.begin_verified_request(text) from public, anon, authenticated;
grant execute on function app.begin_verified_request(text) to adcondo_server;

create or replace function app.has_active_tower_assignment(p_tower_id uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public,app as $$
 select exists(select 1 from public.tower_assignments a where a.tower_id=p_tower_id
 and a.supervisor_id=app.current_user_id() and a.status='ACTIVE' and a.start_date<=current_date
 and (a.end_date is null or a.end_date>=current_date)) $$;

create or replace function app.write_activity(p_action text,p_entity_type text,p_entity_id uuid,p_tower_id uuid default null,p_metadata jsonb default null)
returns void language sql security definer set search_path=pg_catalog,public,app as $$
 insert into public.activity_logs(actor_user_id,tower_id,action,entity_type,entity_id,metadata)
 values(app.current_user_id(),p_tower_id,p_action,p_entity_type,p_entity_id,
   case when p_metadata is null then null else p_metadata - array['token','password','secret','authorization'] end) $$;

-- Firebase is verified before this call. SET LOCAL semantics require BEGIN/COMMIT on one DB connection:
-- BEGIN; SET LOCAL ROLE adcondo_server; SELECT app.begin_verified_request($1); ...; COMMIT.

create or replace function app.start_visit(p_visit_id uuid) returns public.visits
language plpgsql security definer set search_path=pg_catalog,public,app as $$
declare v public.visits; v_template public.checklist_templates; v_snapshot jsonb;
begin
 select * into v from public.visits where id=p_visit_id for update;
 if not found then raise exception 'visit not found'; end if;
 if not (app.is_admin() or (v.supervisor_id=app.current_user_id() and app.has_active_tower_assignment(v.tower_id))) then raise exception 'forbidden' using errcode='42501'; end if;
 if v.status not in ('SCHEDULED','RESCHEDULED') then raise exception 'invalid visit transition'; end if;
 if v.checklist_template_id is null then raise exception 'visit has no checklist template'; end if;
 select * into v_template from public.checklist_templates where id=v.checklist_template_id and active for share;
 if not found then raise exception 'checklist template unavailable'; end if;
 select jsonb_build_object('template_id',v_template.id,'name',v_template.name,'version',v_template.version,'sections',
   coalesce(jsonb_agg(section_data order by section_order),'[]'::jsonb)) into v_snapshot
 from (select s.sort_order section_order,jsonb_build_object('id',s.id,'name',s.name,'required',s.required,'order',s.sort_order,'items',
   coalesce(jsonb_agg(jsonb_build_object('id',i.id,'name',i.name,'required',i.required,'order',i.sort_order) order by i.sort_order)
   filter(where i.id is not null),'[]'::jsonb)) section_data
   from public.checklist_sections s left join public.checklist_items i on i.section_id=s.id and i.active
   where s.template_id=v_template.id and s.active group by s.id,s.name,s.required,s.sort_order) q;
 update public.visits set status='IN_PROGRESS',started_at=now(),started_by_id=app.current_user_id(),updated_by_id=app.current_user_id() where id=v.id returning * into v;
 insert into public.inspections(visit_id,template_id,template_version,template_snapshot,status,started_at)
 values(v.id,v_template.id,v_template.version,v_snapshot,'IN_PROGRESS',now());
 perform app.write_activity('VISIT_STARTED','visit',v.id,v.tower_id,null); return v;
end $$;

create or replace function app.finish_visit(p_visit_id uuid,p_overall_condition public.answer_condition) returns public.visits
language plpgsql security definer set search_path=pg_catalog,public,app as $$
declare v public.visits; v_inspection_id uuid;
begin
 select * into v from public.visits where id=p_visit_id for update;
 if not found or v.status<>'IN_PROGRESS' then raise exception 'visit is not in progress'; end if;
 if not (app.is_admin() or (v.supervisor_id=app.current_user_id() and app.has_active_tower_assignment(v.tower_id))) then raise exception 'forbidden' using errcode='42501'; end if;
 select id into v_inspection_id from public.inspections where visit_id=v.id and status='IN_PROGRESS' for update;
 if v_inspection_id is null then raise exception 'inspection not in progress'; end if;
 if exists(select 1 from public.checklist_items i join public.checklist_sections s on s.id=i.section_id
   join public.inspections x on x.template_id=s.template_id and x.id=v_inspection_id
   left join public.inspection_answers a on a.inspection_id=x.id and a.item_id=i.id
   where i.required and s.active and i.active and a.id is null) then raise exception 'required checklist items are unanswered'; end if;
 update public.inspections set status='COMPLETED',progress=100,completed_at=now(),overall_condition=p_overall_condition where id=v_inspection_id;
 update public.visits set status='COMPLETED',completed_at=now(),completed_by_id=app.current_user_id(),updated_by_id=app.current_user_id() where id=v.id returning * into v;
 perform app.write_activity('VISIT_COMPLETED','visit',v.id,v.tower_id,null); return v;
end $$;

create or replace function app.transition_incident(p_incident_id uuid,p_new_status public.incident_status,p_comment text default null,p_assigned_to_id uuid default null,p_resolution text default null)
returns public.incidents language plpgsql security definer set search_path=pg_catalog,public,app as $$
declare v public.incidents; v_old public.incident_status; v_type public.incident_update_type := 'STATUS_CHANGED';
begin
 select * into v from public.incidents where id=p_incident_id for update; if not found then raise exception 'incident not found'; end if; v_old:=v.status;
 if app.is_admin() then
   if not ((v_old='OPEN' and p_new_status in ('ASSIGNED','IN_PROGRESS')) or (v_old='ASSIGNED' and p_new_status='IN_PROGRESS') or
     (v_old='IN_PROGRESS' and p_new_status in ('PENDING_VERIFICATION','RESOLVED')) or (v_old='PENDING_VERIFICATION' and p_new_status in ('IN_PROGRESS','RESOLVED')) or
     (v_old='RESOLVED' and p_new_status in ('IN_PROGRESS','CLOSED'))) then raise exception 'invalid admin transition'; end if;
 else
   if not app.has_active_tower_assignment(v.tower_id) or not ((v_old in ('OPEN','ASSIGNED') and p_new_status='IN_PROGRESS') or
     (v_old='IN_PROGRESS' and p_new_status='PENDING_VERIFICATION')) then raise exception 'invalid supervisor transition' using errcode='42501'; end if;
   if p_assigned_to_id is distinct from v.assigned_to_id or p_resolution is not null then raise exception 'protected incident fields'; end if;
 end if;
 if p_new_status='ASSIGNED' and p_assigned_to_id is null then raise exception 'assignee required'; end if;
 if p_new_status in ('RESOLVED','CLOSED') and nullif(trim(p_resolution),'') is null then raise exception 'resolution required'; end if;
 update public.incidents set status=p_new_status,assigned_to_id=case when app.is_admin() then coalesce(p_assigned_to_id,assigned_to_id) else assigned_to_id end,
 resolution=case when p_new_status in ('RESOLVED','CLOSED') then p_resolution else resolution end,
 resolved_at=case when p_new_status='RESOLVED' then now() else resolved_at end,resolved_by_id=case when p_new_status='RESOLVED' then app.current_user_id() else resolved_by_id end,
 closed_at=case when p_new_status='CLOSED' then now() else closed_at end,closed_by_id=case when p_new_status='CLOSED' then app.current_user_id() else closed_by_id end
 where id=v.id returning * into v;
 insert into public.incident_updates(incident_id,user_id,type,comment,old_status,new_status,is_internal) values(v.id,app.current_user_id(),v_type,p_comment,v_old,p_new_status,false);
 perform app.write_activity('INCIDENT_STATUS_CHANGED','incident',v.id,v.tower_id,jsonb_build_object('from',v_old,'to',p_new_status)); return v;
end $$;

create or replace function app.transition_material_request(p_request_id uuid,p_new_status public.request_status,p_comment text default null,p_rejection_reason text default null)
returns public.material_requests language plpgsql security definer set search_path=pg_catalog,public,app as $$
declare v public.material_requests; v_old public.request_status;
begin
 select * into v from public.material_requests where id=p_request_id for update; if not found then raise exception 'request not found'; end if; v_old:=v.status;
 if app.is_admin() then
   if not ((v_old='SUBMITTED' and p_new_status in ('UNDER_REVIEW','APPROVED','REJECTED')) or (v_old='UNDER_REVIEW' and p_new_status in ('APPROVED','REJECTED')) or
     (v_old='APPROVED' and p_new_status='PURCHASED') or (v_old='PURCHASED' and p_new_status='DELIVERED')) then raise exception 'invalid admin transition'; end if;
 else
   if v.requested_by_id<>app.current_user_id() or v_old<>'DRAFT' or p_new_status<>'SUBMITTED' or not app.has_active_tower_assignment(v.tower_id) then raise exception 'invalid supervisor transition' using errcode='42501'; end if;
   if not exists(select 1 from public.material_request_items where request_id=v.id) then raise exception 'request has no items'; end if;
 end if;
 if p_new_status='REJECTED' and nullif(trim(p_rejection_reason),'') is null then raise exception 'rejection reason required'; end if;
 update public.material_requests set status=p_new_status,rejection_reason=case when p_new_status='REJECTED' then p_rejection_reason else rejection_reason end,
 approved_at=case when p_new_status='APPROVED' then now() else approved_at end,approved_by_id=case when p_new_status='APPROVED' then app.current_user_id() else approved_by_id end,
 purchased_at=case when p_new_status='PURCHASED' then now() else purchased_at end,purchased_by_id=case when p_new_status='PURCHASED' then app.current_user_id() else purchased_by_id end,
 delivered_at=case when p_new_status='DELIVERED' then now() else delivered_at end,delivered_by_id=case when p_new_status='DELIVERED' then app.current_user_id() else delivered_by_id end
 where id=v.id returning * into v;
 insert into public.material_request_updates(request_id,user_id,old_status,new_status,comment) values(v.id,app.current_user_id(),v_old,p_new_status,p_comment);
 perform app.write_activity('MATERIAL_REQUEST_STATUS_CHANGED','material_request',v.id,v.tower_id,jsonb_build_object('from',v_old,'to',p_new_status)); return v;
end $$;

-- RPC perimeter.
revoke all on function app.firebase_uid(),app.current_user_id(),app.is_admin(),app.is_supervisor(),app.has_active_tower_assignment(uuid),app.write_activity(text,text,uuid,uuid,jsonb),app.start_visit(uuid),app.finish_visit(uuid,public.answer_condition),app.transition_incident(uuid,public.incident_status,text,uuid,text),app.transition_material_request(uuid,public.request_status,text,text) from public,anon,authenticated;
grant execute on function app.firebase_uid(),app.current_user_id(),app.is_admin(),app.is_supervisor(),app.has_active_tower_assignment(uuid),app.start_visit(uuid),app.finish_visit(uuid,public.answer_condition),app.transition_incident(uuid,public.incident_status,text,uuid,text),app.transition_material_request(uuid,public.request_status,text,text) to adcondo_server;

-- RLS on every application table.
do $$ declare t text; begin foreach t in array array['users','catalog_items','system_settings','towers','tower_contacts','tower_photos','tower_assignments','checklist_templates','checklist_sections','checklist_items','visit_recurrences','visits','visit_schedule_history','inspections','inspection_answers','inspection_photos','incidents','incident_updates','incident_photos','inventory_items','tower_inventory','inventory_photos','material_requests','material_request_items','material_request_updates','documents','notifications','activity_logs'] loop execute format('alter table public.%I enable row level security',t); execute format('alter table public.%I force row level security',t); end loop; end $$;

-- ADMIN row policies. No DELETE grants are issued.
do $$ declare t text; begin foreach t in array array['users','catalog_items','system_settings','towers','tower_contacts','tower_photos','tower_assignments','checklist_templates','checklist_sections','checklist_items','visit_recurrences','visits','visit_schedule_history','inspections','inspection_answers','inspection_photos','incidents','incident_updates','incident_photos','inventory_items','tower_inventory','inventory_photos','material_requests','material_request_items','material_request_updates','documents','notifications'] loop execute format('create policy %I on public.%I for all using (app.is_admin()) with check (app.is_admin())',t||'_admin',t); end loop; end $$;

create policy users_self_read on public.users for select using(id=app.current_user_id());
create policy users_self_update on public.users for update using(id=app.current_user_id()) with check(id=app.current_user_id());
create policy catalogs_active_read on public.catalog_items for select using(app.current_user_id() is not null and active);
create policy towers_assigned_read on public.towers for select using(app.has_active_tower_assignment(id));
create policy contacts_assigned_read on public.tower_contacts for select using(app.has_active_tower_assignment(tower_id));
create policy assignments_self_read on public.tower_assignments for select using(supervisor_id=app.current_user_id());
create policy templates_active_read on public.checklist_templates for select using(app.is_supervisor() and active);
create policy sections_read on public.checklist_sections for select using(app.is_supervisor());
create policy items_read on public.checklist_items for select using(app.is_supervisor());
create policy visits_self_read on public.visits for select using(supervisor_id=app.current_user_id());
create policy inspections_self_read on public.inspections for select using(exists(select 1 from public.visits v where v.id=visit_id and v.supervisor_id=app.current_user_id()));
create policy answers_self_all on public.inspection_answers for all using(exists(select 1 from public.inspections i join public.visits v on v.id=i.visit_id where i.id=inspection_id and v.supervisor_id=app.current_user_id())) with check(exists(select 1 from public.inspections i join public.visits v on v.id=i.visit_id where i.id=inspection_id and v.supervisor_id=app.current_user_id()));
create policy inspection_photos_self_read on public.inspection_photos for select using(deleted_at is null and exists(select 1 from public.inspections i join public.visits v on v.id=i.visit_id where i.id=inspection_id and v.supervisor_id=app.current_user_id()));
create policy inspection_photos_self_insert on public.inspection_photos for insert with check(uploaded_by_id=app.current_user_id() and exists(select 1 from public.inspections i join public.visits v on v.id=i.visit_id where i.id=inspection_id and v.supervisor_id=app.current_user_id() and app.has_active_tower_assignment(v.tower_id)));
create policy incidents_assigned_read on public.incidents for select using(app.has_active_tower_assignment(tower_id));
create policy incidents_assigned_insert on public.incidents for insert with check(reported_by_id=app.current_user_id() and status='OPEN' and assigned_to_id is null and resolved_at is null and closed_at is null and app.has_active_tower_assignment(tower_id));
create policy incident_updates_read on public.incident_updates for select using(not is_internal and exists(select 1 from public.incidents i where i.id=incident_id and app.has_active_tower_assignment(i.tower_id)));
create policy incident_updates_insert on public.incident_updates for insert with check(user_id=app.current_user_id() and type='COMMENT' and old_status is null and new_status is null and not is_internal and exists(select 1 from public.incidents i where i.id=incident_id and app.has_active_tower_assignment(i.tower_id)));
create policy incident_photos_assigned_read on public.incident_photos for select using(deleted_at is null and exists(select 1 from public.incidents i where i.id=incident_id and app.has_active_tower_assignment(i.tower_id)));
create policy incident_photos_assigned_insert on public.incident_photos for insert with check(uploaded_by_id=app.current_user_id() and exists(select 1 from public.incidents i where i.id=incident_id and app.has_active_tower_assignment(i.tower_id)));
create policy inventory_items_read on public.inventory_items for select using(app.is_supervisor() and active);
create policy tower_inventory_read on public.tower_inventory for select using(app.has_active_tower_assignment(tower_id));
create policy tower_inventory_update on public.tower_inventory for update using(app.has_active_tower_assignment(tower_id)) with check(app.has_active_tower_assignment(tower_id));
create policy inventory_photos_assigned_read on public.inventory_photos for select using(deleted_at is null and exists(select 1 from public.tower_inventory ti where ti.id=tower_inventory_id and app.has_active_tower_assignment(ti.tower_id)));
create policy inventory_photos_assigned_insert on public.inventory_photos for insert with check(uploaded_by_id=app.current_user_id() and exists(select 1 from public.tower_inventory ti where ti.id=tower_inventory_id and app.has_active_tower_assignment(ti.tower_id)));
create policy requests_own_read on public.material_requests for select using(requested_by_id=app.current_user_id());
create policy requests_own_insert on public.material_requests for insert with check(requested_by_id=app.current_user_id() and status='DRAFT' and app.has_active_tower_assignment(tower_id));
create policy request_items_own_all on public.material_request_items for all using(exists(select 1 from public.material_requests r where r.id=request_id and r.requested_by_id=app.current_user_id() and r.status='DRAFT')) with check(exists(select 1 from public.material_requests r where r.id=request_id and r.requested_by_id=app.current_user_id() and r.status='DRAFT'));
create policy request_updates_own_read on public.material_request_updates for select using(exists(select 1 from public.material_requests r where r.id=request_id and r.requested_by_id=app.current_user_id()));
create policy documents_assigned_read on public.documents for select using(status='ACTIVE' and tower_id is not null and app.has_active_tower_assignment(tower_id));
create policy notifications_self_read on public.notifications for select using(user_id=app.current_user_id());
create policy notifications_self_update on public.notifications for update using(user_id=app.current_user_id()) with check(user_id=app.current_user_id());
create policy activity_logs_admin_read on public.activity_logs for select using(app.is_admin());

create or replace function app.protect_user_security_fields() returns trigger
language plpgsql security invoker set search_path=pg_catalog,public,app as $$
begin
 if not app.is_admin() and (new.id<>old.id or new.firebase_uid is distinct from old.firebase_uid or
   new.email is distinct from old.email or new.role is distinct from old.role or new.status is distinct from old.status or
   new.employee_code is distinct from old.employee_code or new.first_name is distinct from old.first_name or
   new.last_name is distinct from old.last_name or new.job_title is distinct from old.job_title or
   new.notes is distinct from old.notes or new.last_login_at is distinct from old.last_login_at) then
   raise exception 'protected user fields' using errcode='42501';
 end if; return new;
end $$;
create trigger users_protected_fields before update on public.users for each row execute function app.protect_user_security_fields();

create or replace function app.enforce_catalog_reference() returns trigger
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare v_id uuid; v_type text;
begin
 v_id := nullif(to_jsonb(new)->>tg_argv[0],'')::uuid; v_type := tg_argv[1];
 if v_id is not null and not exists(select 1 from public.catalog_items where id=v_id and catalog_type=v_type and active) then
   raise exception 'invalid or inactive % catalog reference',v_type;
 end if; return new;
end $$;
create trigger visits_visit_type_ck before insert or update of visit_type_id on public.visits for each row execute function app.enforce_catalog_reference('visit_type_id','VISIT_TYPE');
create trigger incidents_area_ck before insert or update of area_id on public.incidents for each row execute function app.enforce_catalog_reference('area_id','INCIDENT_AREA');
create trigger incidents_category_ck before insert or update of category_id on public.incidents for each row execute function app.enforce_catalog_reference('category_id','INCIDENT_CATEGORY');
create trigger inventory_category_ck before insert or update of category_id on public.inventory_items for each row execute function app.enforce_catalog_reference('category_id','INVENTORY_CATEGORY');
create trigger inventory_unit_ck before insert or update of unit_id on public.inventory_items for each row execute function app.enforce_catalog_reference('unit_id','UNIT');
create trigger documents_category_ck before insert or update of category_id on public.documents for each row execute function app.enforce_catalog_reference('category_id','DOCUMENT_CATEGORY');

-- Table/column grants. Policies still decide rows. Protected state changes use RPCs only.
revoke all on all tables in schema public from public,anon,authenticated,adcondo_server;
grant select on all tables in schema public to adcondo_server;
grant insert,update on public.catalog_items,public.system_settings,public.towers,public.tower_contacts,public.tower_assignments,public.checklist_templates,public.checklist_sections,public.checklist_items,public.visit_recurrences,public.inventory_items,public.documents to adcondo_server;
grant insert on public.visits,public.incident_updates,public.incident_photos,public.inspection_photos,public.inventory_photos,public.material_request_items to adcondo_server;
grant insert(code,tower_id,visit_id,inspection_id,answer_id,reported_by_id,area_id,category_id,title,description,priority,status) on public.incidents to adcondo_server;
grant insert(code,visit_id,tower_id,requested_by_id,status,notes) on public.material_requests to adcondo_server;
grant insert,update on public.users to adcondo_server;
grant update(condition,observation,responsible,material_needed,priority) on public.inspection_answers to adcondo_server;
grant insert on public.inspection_answers to adcondo_server;
grant update(quantity,recommended_quantity,location,observation,stock_status,last_checked_by_id,last_checked_at) on public.tower_inventory to adcondo_server;
grant update(current_quantity,requested_quantity,observation) on public.material_request_items to adcondo_server;
grant update(read_at) on public.notifications to adcondo_server;

-- Immutable IDs/responsibles/status are absent from supervisor-facing UPDATE grants. RPCs lock rows,
-- derive actor IDs from app.current_user_id(), validate transitions and append audit in one transaction.
