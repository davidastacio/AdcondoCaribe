-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT APPROVAL.
create extension if not exists pgcrypto with schema extensions;
create schema if not exists app;

create type public.app_role as enum ('ADMIN','SUPERVISOR');
create type public.user_status as enum ('PENDING','ACTIVE','INACTIVE','SUSPENDED');
create type public.assignment_status as enum ('ACTIVE','ENDED','SUSPENDED');
create type public.tower_status as enum ('ACTIVE','OBSERVATION','MAINTENANCE','INACTIVE');
create type public.tower_type as enum ('TOWER','CONDOMINIUM','RESIDENTIAL');
create type public.priority as enum ('LOW','MEDIUM','HIGH','CRITICAL');
create type public.visit_status as enum ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED','RESCHEDULED');
create type public.recurrence_frequency as enum ('ONCE','WEEKLY','BIWEEKLY','MONTHLY');
create type public.inspection_status as enum ('NOT_STARTED','IN_PROGRESS','COMPLETED');
create type public.answer_condition as enum ('OPTIMAL','REGULAR','BAD','NOT_APPLICABLE');
create type public.incident_status as enum ('OPEN','ASSIGNED','IN_PROGRESS','PENDING_VERIFICATION','RESOLVED','CLOSED');
create type public.incident_update_type as enum ('CREATED','COMMENT','ASSIGNED','STATUS_CHANGED','WORK_COMPLETED','VERIFIED','CORRECTION_REQUIRED','INTERNAL_NOTE');
create type public.incident_photo_type as enum ('BEFORE','AFTER','GENERAL');
create type public.stock_status as enum ('AVAILABLE','LOW_STOCK','OUT_OF_STOCK','NOT_VERIFIED');
create type public.request_status as enum ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','PURCHASED','DELIVERED');
create type public.document_status as enum ('ACTIVE','ARCHIVED','DELETED');

create or replace function app.set_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public, app as $$
begin new.updated_at = now(); return new; end $$;

