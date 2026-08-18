import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch, supabaseStorageFetch } from "@/lib/database/verified-request";
import { fetchRealIncidents } from "@/lib/incidents/server";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime="nodejs";
const schema=z.object({towerId:z.string().uuid(),areaId:z.string().uuid(),categoryId:z.string().uuid(),title:z.string().trim().min(3).max(200),description:z.string().trim().min(5).max(4000),observation:z.string().trim().max(1000).optional(),priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]),assignedToId:z.string().uuid().optional(),visitId:z.string().uuid().optional(),itemId:z.string().uuid().optional()});
const mimeExtensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};

export async function GET(){
  const user=await getServerSessionUser();if(!user)return Response.json({error:"No autorizado."},{status:403});
  try{return Response.json({incidents:await fetchRealIncidents(user.role==="ADMIN"?undefined:user.id)})}catch{return Response.json({error:"No se pudieron cargar las incidencias."},{status:502})}
}

export async function POST(request:Request){
  const user=await getServerSessionUser();if(!user||user.role==="ADMIN")return Response.json({error:"No autorizado."},{status:403});
  try{
    const form=await request.formData();
    const optional=(name:string)=>{const value=String(form.get(name)??"").trim();return value||undefined};
    const input=schema.parse({towerId:form.get("towerId"),areaId:form.get("areaId"),categoryId:form.get("categoryId"),title:form.get("title"),description:form.get("description"),observation:optional("observation"),priority:form.get("priority"),assignedToId:optional("assignedToId"),visitId:optional("visitId"),itemId:optional("itemId")});
    const assignmentResponse=await supabaseServerFetch(`tower_assignments?select=id&tower_id=eq.${input.towerId}&supervisor_id=eq.${user.id}&status=eq.ACTIVE&limit=1`);
    if(!assignmentResponse.ok||(await assignmentResponse.json() as unknown[]).length===0)return Response.json({error:"No tienes esta torre asignada."},{status:403});
    let inspectionId:string|undefined,answerId:string|undefined;
    if(input.visitId){
      const visitResponse=await supabaseServerFetch(`visits?select=id,tower_id,supervisor_id&id=eq.${input.visitId}&limit=1`),[visit]=visitResponse.ok?await visitResponse.json() as {id:string;tower_id:string;supervisor_id:string}[]:[];
      if(!visit||visit.supervisor_id!==user.id||visit.tower_id!==input.towerId)return Response.json({error:"La visita relacionada no es válida."},{status:400});
      const inspectionResponse=await supabaseServerFetch(`inspections?select=id&visit_id=eq.${visit.id}&limit=1`),[inspection]=inspectionResponse.ok?await inspectionResponse.json() as {id:string}[]:[];
      inspectionId=inspection?.id;
      if(inspectionId&&input.itemId){const answerResponse=await supabaseServerFetch(`inspection_answers?select=id&inspection_id=eq.${inspectionId}&item_id=eq.${input.itemId}&limit=1`),[answer]=answerResponse.ok?await answerResponse.json() as {id:string}[]:[];answerId=answer?.id;}
    }
    const description=input.observation?`${input.description}\n\nObservación adicional: ${input.observation}`:input.description;
    const code=`INC-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${randomBytes(2).toString("hex").toUpperCase()}`;
    const incidentResponse=await supabaseServerFetch("incidents",{method:"POST",headers:{"content-type":"application/json",Prefer:"return=representation"},body:JSON.stringify({code,tower_id:input.towerId,visit_id:input.visitId??null,inspection_id:inspectionId??null,answer_id:answerId??null,reported_by_id:user.id,assigned_to_id:null,area_id:input.areaId,category_id:input.categoryId,title:input.title,description,priority:input.priority,status:"OPEN"})});
    const [incident]=incidentResponse.ok?await incidentResponse.json() as {id:string}[]:[];
    if(!incident)return Response.json({error:"No se pudo registrar la incidencia."},{status:502});
    await supabaseServerFetch("incident_updates",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({incident_id:incident.id,user_id:user.id,type:"CREATED",comment:"Incidencia reportada.",is_internal:false})});
    await supabaseServerFetch("activity_logs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({actor_user_id:user.id,tower_id:input.towerId,action:"INCIDENT_CREATED",entity_type:"incident",entity_id:incident.id,metadata:{code,priority:input.priority,visit_id:input.visitId??null},user_agent:request.headers.get("user-agent")})});
    const files=form.getAll("photos").filter((value):value is File=>value instanceof File&&value.size>0).slice(0,8);
    for(const file of files){
      const extension=mimeExtensions[file.type];if(!extension||file.size>10*1024*1024)continue;
      const storageKey=`${input.towerId}/${incident.id}/${randomUUID()}.${extension}`;
      const uploaded=await supabaseStorageFetch(`object/incident-photos/${storageKey}`,{method:"POST",headers:{"content-type":file.type,"x-upsert":"false"},body:await file.arrayBuffer()});
      if(uploaded.ok)await supabaseServerFetch("incident_photos",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({incident_id:incident.id,storage_key:storageKey,type:"BEFORE",uploaded_by_id:user.id})});
    }
    return Response.json({incidentId:incident.id},{status:201});
  }catch(error){if(error instanceof z.ZodError)return Response.json({error:error.issues[0]?.message??"Revisa los campos."},{status:400});return Response.json({error:"No se pudo procesar la incidencia."},{status:500})}
}
