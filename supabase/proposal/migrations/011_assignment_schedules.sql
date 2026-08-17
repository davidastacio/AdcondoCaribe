alter table public.tower_assignments
  add column if not exists work_days smallint[] not null default array[1,2,3,4,5]::smallint[],
  add column if not exists shift_start time,
  add column if not exists shift_end time;

alter table public.tower_assignments
  drop constraint if exists tower_assignments_work_days_ck,
  add constraint tower_assignments_work_days_ck
    check (
      cardinality(work_days) between 1 and 7
      and work_days <@ array[0,1,2,3,4,5,6]::smallint[]
    ),
  drop constraint if exists tower_assignments_shift_ck,
  add constraint tower_assignments_shift_ck
    check (
      (shift_start is null and shift_end is null)
      or (shift_start is not null and shift_end is not null and shift_start < shift_end)
    );

create or replace function app.enforce_supervisor_assignment()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if not exists(
    select 1
    from public.users
    where id = new.supervisor_id
      and role in ('SUPERVISOR', 'INCIDENT_SUPERVISOR')
      and status = 'ACTIVE'
  ) then
    raise exception 'supervisor_id must reference an active supervisor user';
  end if;
  return new;
end
$$;
