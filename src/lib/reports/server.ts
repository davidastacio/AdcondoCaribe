import type { ActivityEntity, ActivityLog } from "@/features/reports/types";
import { supabaseServerFetch } from "@/lib/database/verified-request";

type ActivityRow = { id:string; actor_user_id:string|null; tower_id:string|null; action:string; entity_type:string; entity_id:string|null; metadata:Record<string,unknown>|null; created_at:string };
type UserRow = { id:string; first_name:string; last_name:string };
type TowerRow = { id:string; name:string };

const entityMap: Record<string, ActivityEntity> = { visit:"VISIT", inspection:"VISIT", incident:"INCIDENT", tower_inventory:"INVENTORY", material_request:"REQUEST", user:"USER", document:"DOCUMENT" };
const actionLabels: Record<string,string> = { VISIT_CREATED:"Visita programada", VISIT_STARTED:"Visita iniciada", VISIT_COMPLETED:"Visita finalizada", VISIT_CANCELLED:"Visita cancelada", VISIT_RESCHEDULED:"Visita reprogramada", INCIDENT_CREATED:"Incidencia reportada", INCIDENT_ASSIGNED:"Incidencia asignada", INCIDENT_STATUS_CHANGED:"Estado de incidencia actualizado", INVENTORY_REVIEWED:"Inventario revisado", MATERIAL_REQUEST_CREATED:"Solicitud de materiales creada", MATERIAL_REQUEST_STATUS_CHANGED:"Estado de solicitud actualizado", DOCUMENT_UPLOADED:"Documento cargado", DOCUMENT_ARCHIVED:"Documento archivado", USER_CREATED:"Usuario creado", USER_UPDATED:"Usuario actualizado" };

function describe(row:ActivityRow){const detail=row.metadata?.code??row.metadata?.name,label=actionLabels[row.action]??row.action.replaceAll("_"," ").toLowerCase();return detail?`${label} · ${String(detail)}`:label}

export async function fetchRealActivity(limit=250){
  const safeLimit=Math.min(Math.max(limit,1),500);
  const [activityResponse,userResponse,towerResponse]=await Promise.all([
    supabaseServerFetch(`activity_logs?select=id,actor_user_id,tower_id,action,entity_type,entity_id,metadata,created_at&order=created_at.desc&limit=${safeLimit}`),
    supabaseServerFetch("users?select=id,first_name,last_name"),
    supabaseServerFetch("towers?select=id,name"),
  ]);
  if(![activityResponse,userResponse,towerResponse].every(response=>response.ok))throw new Error("No se pudo consultar el historial.");
  const rows=await activityResponse.json() as ActivityRow[],users=new Map((await userResponse.json() as UserRow[]).map(row=>[row.id,`${row.first_name} ${row.last_name}`])),towers=new Map((await towerResponse.json() as TowerRow[]).map(row=>[row.id,row.name]));
  return rows.map((row):ActivityLog=>({id:row.id,userId:row.actor_user_id??"system",userName:row.actor_user_id?users.get(row.actor_user_id)??"Usuario":"Sistema",towerId:row.tower_id??undefined,towerName:row.tower_id?towers.get(row.tower_id):undefined,action:row.action,entityType:entityMap[row.entity_type.toLowerCase()]??"USER",entityId:row.entity_id??row.id,description:describe(row),createdAt:row.created_at}));
}
