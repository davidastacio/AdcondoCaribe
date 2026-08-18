import type { IncidentPriority, IncidentStatus, IncidentUpdateType } from "@/features/incidents/types";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch, supabaseStorageFetch } from "@/lib/database/verified-request";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime="nodejs";
type Context={params:Promise<{incidentId:string}>};
type IncidentRow={id:string;tower_id:string;reported_by_id:string;assigned_to_id:string|null;priority:IncidentPriority;status:IncidentStatus};
const actionSchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("COMMENT"),comment:z.string().trim().min(2).max(2000),internal:z.boolean().default(false)}),
  z.object({action:z.literal("ASSIGN"),assignedToId:z.string().uuid(),comment:z.string().trim().max(1000).optional()}),
  z.object({action:z.literal("PRIORITY"),priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]),comment:z.string().trim().max(1000).optional()}),
  z.object({action:z.literal("START"),comment:z.string().trim().max(1000).optional()}),
  z.object({action:z.literal("WORK_COMPLETED"),comment:z.string().trim().min(3).max(2000)}),
  z.object({action:z.literal("VERIFY"),approved:z.boolean(),comment:z.string().trim().max(2000).optional()}),
  z.object({action:z.literal("CLOSE"),comment:z.string().trim().min(3).max(2000)}),
]);
const mimeExtensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};

async function insertUpdate(incidentId:string,userId:string,type:IncidentUpdateType,comment:string,oldStatus?:IncidentStatus,newStatus?:IncidentStatus,internal=false){
  const response=await supabaseServerFetch("incident_updates",{method:"POST",headers:{"content-type":"application/json",Prefer:"return=representation"},body:JSON.stringify({incident_id:incidentId,user_id:userId,type,comment,old_status:oldStatus??null,new_status:newStatus??null,is_internal:internal})});
  const [row]=response.ok?await response.json() as {id:string}[]:[];if(!row)throw new Error("No se pudo guardar el historial.");return row.id;
}
async function audit(request:Request,userId:string,incident:IncidentRow,action:string,metadata:Record<string,unknown>){await supabaseServerFetch("activity_logs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({actor_user_id:userId,tower_id:incident.tower_id,action,entity_type:"incident",entity_id:incident.id,metadata,user_agent:request.headers.get("user-agent")})});}

export async function POST(request:Request,{params}:Context){
  const user=await getServerSessionUser();if(!user)return Response.json({error:"No autorizado."},{status:403});
  try{
    const {incidentId}=await params,form=await request.formData(),payload=actionSchema.parse(JSON.parse(String(form.get("payload")??"{}")));
    const incidentResponse=await supabaseServerFetch(`incidents?select=id,tower_id,reported_by_id,assigned_to_id,priority,status&id=eq.${incidentId}&limit=1`),[incident]=incidentResponse.ok?await incidentResponse.json() as IncidentRow[]:[];
    if(!incident)return Response.json({error:"Incidencia no encontrada."},{status:404});
    const admin=user.role==="ADMIN",reporter=incident.reported_by_id===user.id,assignee=incident.assigned_to_id===user.id;
    if(!admin&&!reporter&&!assignee)return Response.json({error:"No tienes acceso a esta incidencia."},{status:403});
    let updateType:IncidentUpdateType="STATUS_CHANGED",comment="",newStatus:IncidentStatus|undefined,patch:Record<string,unknown>={},internal=false;
    if(payload.action==="COMMENT"){
      if(incident.status==="CLOSED"||(!admin&&payload.internal))return Response.json({error:"Esta acción no está permitida."},{status:403});
      updateType=payload.internal?"INTERNAL_NOTE":"COMMENT";comment=payload.comment;internal=payload.internal;
    }else if(payload.action==="ASSIGN"){
      if(!admin||!["OPEN","ASSIGNED"].includes(incident.status))return Response.json({error:"No se puede asignar en este estado."},{status:409});
      const assigneeResponse=await supabaseServerFetch(`users?select=id&id=eq.${payload.assignedToId}&role=in.(SUPERVISOR,INCIDENT_SUPERVISOR)&status=eq.ACTIVE&limit=1`);
      if(!assigneeResponse.ok||(await assigneeResponse.json() as unknown[]).length===0)return Response.json({error:"El responsable seleccionado no está activo."},{status:400});
      newStatus="ASSIGNED";patch={assigned_to_id:payload.assignedToId,status:newStatus};updateType="ASSIGNED";comment=payload.comment||"Incidencia asignada a un responsable.";
    }else if(payload.action==="PRIORITY"){
      if(!admin||incident.status==="CLOSED")return Response.json({error:"No se puede cambiar la prioridad."},{status:403});
      patch={priority:payload.priority};comment=payload.comment||`Prioridad cambiada de ${incident.priority} a ${payload.priority}.`;
    }else if(payload.action==="START"){
      if((!admin&&!assignee)||!["OPEN","ASSIGNED"].includes(incident.status))return Response.json({error:"No puedes iniciar este trabajo."},{status:409});
      newStatus="IN_PROGRESS";patch={status:newStatus};comment=payload.comment||"Trabajo iniciado por el responsable.";
    }else if(payload.action==="WORK_COMPLETED"){
      if((!admin&&!assignee)||incident.status!=="IN_PROGRESS")return Response.json({error:"No puedes completar este trabajo."},{status:409});
      newStatus="PENDING_VERIFICATION";patch={status:newStatus,resolution:payload.comment};updateType="WORK_COMPLETED";comment=payload.comment;
    }else if(payload.action==="VERIFY"){
      if((!admin&&!reporter)||incident.status!=="PENDING_VERIFICATION")return Response.json({error:"No puedes verificar esta incidencia."},{status:409});
      if(!payload.approved&&!payload.comment?.trim())return Response.json({error:"Explica qué debe corregirse."},{status:400});
      newStatus=payload.approved?"RESOLVED":"IN_PROGRESS";patch=payload.approved?{status:newStatus,resolved_at:new Date().toISOString(),resolved_by_id:user.id}:{status:newStatus,resolution:null,resolved_at:null,resolved_by_id:null};updateType=payload.approved?"VERIFIED":"CORRECTION_REQUIRED";comment=payload.comment||"Trabajo verificado y aprobado.";
    }else{
      if(!admin||incident.status!=="RESOLVED")return Response.json({error:"Solo administración puede cerrar una incidencia resuelta."},{status:409});
      newStatus="CLOSED";patch={status:newStatus,closed_at:new Date().toISOString(),closed_by_id:user.id};comment=payload.comment;
    }
    if(Object.keys(patch).length){const updated=await supabaseServerFetch(`incidents?id=eq.${incident.id}&status=eq.${incident.status}`,{method:"PATCH",headers:{"content-type":"application/json",Prefer:"return=representation"},body:JSON.stringify(patch)});if(!updated.ok||(await updated.json() as unknown[]).length===0)return Response.json({error:"La incidencia cambió mientras trabajabas. Actualiza e intenta nuevamente."},{status:409});}
    const updateId=await insertUpdate(incident.id,user.id,updateType,comment,newStatus?incident.status:undefined,newStatus,internal);
    if(payload.action==="WORK_COMPLETED"){
      const files=form.getAll("photos").filter((value):value is File=>value instanceof File&&value.size>0).slice(0,8);
      for(const file of files){const extension=mimeExtensions[file.type];if(!extension||file.size>10*1024*1024)continue;const storageKey=`${incident.tower_id}/${incident.id}/${randomUUID()}.${extension}`;const uploaded=await supabaseStorageFetch(`object/incident-photos/${storageKey}`,{method:"POST",headers:{"content-type":file.type,"x-upsert":"false"},body:await file.arrayBuffer()});if(uploaded.ok)await supabaseServerFetch("incident_photos",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({incident_id:incident.id,incident_update_id:updateId,storage_key:storageKey,type:"AFTER",uploaded_by_id:user.id})});}
    }
    await audit(request,user.id,incident,payload.action,{from_status:incident.status,to_status:newStatus??incident.status});
    return Response.json({ok:true});
  }catch(error){if(error instanceof z.ZodError)return Response.json({error:error.issues[0]?.message??"Revisa los datos."},{status:400});return Response.json({error:error instanceof Error?error.message:"No se pudo actualizar la incidencia."},{status:500});}
}
