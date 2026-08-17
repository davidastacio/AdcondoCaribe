import type { Visit } from "@/features/visits/types";
import { supabaseServerFetch } from "@/lib/database/verified-request";

type VisitRow = { id:string;code:string;tower_id:string;supervisor_id:string;checklist_template_id:string|null;status:Visit["status"];scheduled_date:string;scheduled_time:string;estimated_duration_minutes:number;visit_type_id:string|null;priority:"LOW"|"MEDIUM"|"HIGH"|null;notes:string|null;started_at:string|null;completed_at:string|null;cancelled_at:string|null;cancellation_reason:string|null;created_by_id:string; };
type TowerRow = {id:string;name:string;code:string;sector:string|null;address:string};
type UserRow = {id:string;first_name:string;last_name:string};
type CatalogRow = {id:string;label:string};
type TemplateRow = {id:string;name:string};
type InspectionRow = {visit_id:string;progress:number};
export const visitSelect="id,code,tower_id,supervisor_id,checklist_template_id,status,scheduled_date,scheduled_time,estimated_duration_minutes,visit_type_id,priority,notes,started_at,completed_at,cancelled_at,cancellation_reason,created_by_id";

export async function fetchRealVisits(supervisorId?:string){
  const filter=supervisorId?`&supervisor_id=eq.${encodeURIComponent(supervisorId)}`:"";
  const [visitsResponse,towersResponse,usersResponse,catalogResponse,templatesResponse,inspectionsResponse]=await Promise.all([
    supabaseServerFetch(`visits?select=${visitSelect}${filter}&order=scheduled_date.asc,scheduled_time.asc`),
    supabaseServerFetch("towers?select=id,name,code,sector,address"),supabaseServerFetch("users?select=id,first_name,last_name"),
    supabaseServerFetch("catalog_items?select=id,label&catalog_type=eq.VISIT_TYPE"),supabaseServerFetch("checklist_templates?select=id,name"),
    supabaseServerFetch("inspections?select=visit_id,progress"),
  ]);
  if(![visitsResponse,towersResponse,usersResponse,catalogResponse,templatesResponse,inspectionsResponse].every(r=>r.ok))throw new Error("No se pudieron consultar las visitas.");
  const rows=await visitsResponse.json() as VisitRow[],towers=new Map((await towersResponse.json() as TowerRow[]).map(x=>[x.id,x])),users=new Map((await usersResponse.json() as UserRow[]).map(x=>[x.id,`${x.first_name} ${x.last_name}`])),catalog=new Map((await catalogResponse.json() as CatalogRow[]).map(x=>[x.id,x.label])),templates=new Map((await templatesResponse.json() as TemplateRow[]).map(x=>[x.id,x.name])),progress=new Map((await inspectionsResponse.json() as InspectionRow[]).map(x=>[x.visit_id,x.progress]));
  return rows.map((row):Visit=>{const tower=towers.get(row.tower_id);return{id:row.id,code:row.code,towerId:row.tower_id,supervisorId:row.supervisor_id,towerName:tower?.name??"Torre",towerCode:tower?.code??"",sector:tower?.sector??"",address:tower?.address??"",scheduledDate:row.scheduled_date,scheduledTime:row.scheduled_time.slice(0,5),status:row.status,supervisor:users.get(row.supervisor_id)??"Supervisor",progress:progress.get(row.id)??0,startedAt:row.started_at??undefined,completedAt:row.completed_at??undefined,estimatedDuration:row.estimated_duration_minutes,visitType:row.visit_type_id?catalog.get(row.visit_type_id):undefined,checklistTemplateId:row.checklist_template_id??undefined,checklistTemplateName:row.checklist_template_id?templates.get(row.checklist_template_id):undefined,notes:row.notes??undefined,priority:row.priority??undefined,cancelledAt:row.cancelled_at??undefined,cancellationReason:row.cancellation_reason??undefined,createdById:row.created_by_id}});
}
