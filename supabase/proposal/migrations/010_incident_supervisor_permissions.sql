create or replace function app.is_supervisor()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists(
    select 1
    from public.users
    where id = app.current_user_id()
      and role in ('SUPERVISOR', 'INCIDENT_SUPERVISOR')
      and status = 'ACTIVE'
  )
$$;

revoke all on function app.is_supervisor() from public, anon, authenticated;
grant execute on function app.is_supervisor() to adcondo_server;
