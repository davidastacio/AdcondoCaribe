import type { Incident, IncidentPhoto, IncidentStatus, IncidentUpdate } from "@/features/incidents/types";
import { supabaseServerFetch } from "@/lib/database/verified-request";

type IncidentRow={id:string;code:string;tower_id:string;visit_id:string|null;inspection_id:string|null;answer_id:string|null;reported_by_id:string;assigned_to_id:string|null;area_id:string|null;category_id:string|null;title:string;description:string;priority:Incident["priority"];status:IncidentStatus;resolved_at:string|null;closed_at:string|null;created_at:string;updated_at:string};
type TowerRow={id:string;name:string;code:string;address:string;sector:string|null};
type UserRow={id:string;first_name:string;last_name:string;role:string};
type CatalogRow={id:string;label:string};
type UpdateRow={id:string;incident_id:string;user_id:string;type:IncidentUpdate["type"];comment:string|null;old_status:IncidentStatus|null;new_status:IncidentStatus|null;is_internal:boolean;created_at:string};
type PhotoRow={id:string;incident_id:string;incident_update_id:string|null;type:IncidentPhoto["type"];created_at:string};

const select="id,code,tower_id,visit_id,inspection_id,answer_id,reported_by_id,assigned_to_id,area_id,category_id,title,description,priority,status,resolved_at,closed_at,created_at,updated_at";
export async function fetchRealIncidents(reportedById?:string){
  const filter=reportedById?`&reported_by_id=eq.${encodeURIComponent(reportedById)}`:"";
  const [incidentResponse,towerResponse,userResponse,catalogResponse,updateResponse,photoResponse]=await Promise.all([
    supabaseServerFetch(`incidents?select=${select}${filter}&order=created_at.desc`),
    supabaseServerFetch("towers?select=id,name,code,address,sector"),
    supabaseServerFetch("users?select=id,first_name,last_name,role"),
    supabaseServerFetch("catalog_items?select=id,label&catalog_type=in.(INCIDENT_AREA,INCIDENT_CATEGORY)"),
    supabaseServerFetch("incident_updates?select=id,incident_id,user_id,type,comment,old_status,new_status,is_internal,created_at&order=created_at.asc"),
    supabaseServerFetch("incident_photos?select=id,incident_id,incident_update_id,type,created_at&deleted_at=is.null&order=created_at.asc"),
  ]);
  if(![incidentResponse,towerResponse,userResponse,catalogResponse,updateResponse,photoResponse].every(response=>response.ok))throw new Error("No se pudieron consultar las incidencias.");
  const rows=await incidentResponse.json() as IncidentRow[];
  const towers=new Map((await towerResponse.json() as TowerRow[]).map(row=>[row.id,row]));
  const users=new Map((await userResponse.json() as UserRow[]).map(row=>[row.id,row]));
  const catalogs=new Map((await catalogResponse.json() as CatalogRow[]).map(row=>[row.id,row.label]));
  const updates=await updateResponse.json() as UpdateRow[];
  const photos=await photoResponse.json() as PhotoRow[];
  const photoOf=(row:PhotoRow):IncidentPhoto=>({id:row.id,url:`/api/incidents/${row.incident_id}/photos/${row.id}`,type:row.type,createdAt:row.created_at,incidentUpdateId:row.incident_update_id??undefined});
  return rows.map((row):Incident=>{
    const tower=towers.get(row.tower_id),reporter=users.get(row.reported_by_id),assignee=row.assigned_to_id?users.get(row.assigned_to_id):undefined;
    const incidentPhotos=photos.filter(photo=>photo.incident_id===row.id);
    return{id:row.id,code:row.code,towerId:row.tower_id,towerName:tower?.name??"Torre",towerCode:tower?.code??"",address:tower?.address??"",sector:tower?.sector??"",visitId:row.visit_id??undefined,inspectionId:row.inspection_id??undefined,inspectionAnswerId:row.answer_id??undefined,reportedById:row.reported_by_id,reportedBy:reporter?`${reporter.first_name} ${reporter.last_name}`:"Supervisor",assignedToId:row.assigned_to_id??undefined,assignedTo:assignee?`${assignee.first_name} ${assignee.last_name}`:undefined,assigneeType:assignee?"INTERNAL":undefined,area:row.area_id?catalogs.get(row.area_id)??"Sin área":"Sin área",category:row.category_id?catalogs.get(row.category_id)??"General":"General",title:row.title,description:row.description,priority:row.priority,status:row.status,photos:incidentPhotos.filter(photo=>!photo.incident_update_id).map(photoOf),updates:updates.filter(update=>update.incident_id===row.id).map((update):IncidentUpdate=>{const actor=users.get(update.user_id);return{id:update.id,userId:update.user_id,userName:actor?`${actor.first_name} ${actor.last_name}`:"Usuario",userRole:actor?.role??"Usuario",type:update.type,comment:update.comment??"",oldStatus:update.old_status??undefined,newStatus:update.new_status??undefined,photos:incidentPhotos.filter(photo=>photo.incident_update_id===update.id).map(photoOf),createdAt:update.created_at,internal:update.is_internal}}),createdAt:row.created_at,updatedAt:row.updated_at,resolvedAt:row.resolved_at??undefined,closedAt:row.closed_at??undefined};
  });
}
