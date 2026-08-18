"use client";

import type { Incident, IncidentPhoto, IncidentPriority } from "@/features/incidents/types";
import { ArrowLeft, Building2, CalendarDays, ClipboardCheck, Link2, MapPin, Play, Send, ShieldCheck, UserCheck, UserRound, Wrench } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IncidentPriorityBadge, IncidentStatusBadge } from "./incident-badges";
import { IncidentPhotoUploader } from "./photo-uploader";
import { IncidentTimeline } from "./incident-timeline";
import { PhotoGallery } from "./photo-gallery";

type Capabilities={canAssign:boolean;canChangePriority:boolean;canComment:boolean;canInternalNote:boolean;canStart:boolean;canComplete:boolean;canVerify:boolean;canClose:boolean};
type Assignee={id:string;first_name:string;last_name:string;job_title:string|null;role:string};
type DetailResponse={incident?:Incident;capabilities?:Capabilities;error?:string};

export function IncidentDetail({incidentId,role}:{incidentId:string;role:"ADMIN"|"SUPERVISOR"|"INCIDENT_SUPERVISOR"}){
  const [incident,setIncident]=useState<Incident>();
  const [capabilities,setCapabilities]=useState<Capabilities>();
  const [assignees,setAssignees]=useState<Assignee[]>([]);
  const [comment,setComment]=useState("");
  const [internal,setInternal]=useState(false);
  const [assigneeId,setAssigneeId]=useState("");
  const [priority,setPriority]=useState<IncidentPriority>("MEDIUM");
  const [workComment,setWorkComment]=useState("");
  const [workPhotos,setWorkPhotos]=useState<IncidentPhoto[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const base=role==="ADMIN"?"/admin/incidencias":"/supervisor/incidencias";

  const load=useCallback(async()=>{const response=await fetch(`/api/incidents/${incidentId}`,{cache:"no-store"}),data=await response.json() as DetailResponse;if(!response.ok||!data.incident||!data.capabilities)throw new Error(data.error||"Incidencia no encontrada.");setIncident(data.incident);setCapabilities(data.capabilities);setAssigneeId(data.incident.assignedToId??"");setPriority(data.incident.priority);},[incidentId]);
  useEffect(()=>{load().catch(reason=>setError(reason instanceof Error?reason.message:"Incidencia no encontrada."));},[load]);
  useEffect(()=>{if(role!=="ADMIN")return;fetch("/api/incidents/options",{cache:"no-store"}).then(response=>response.json()).then((data:{assignees?:Assignee[]})=>setAssignees(data.assignees??[])).catch(()=>setAssignees([]));},[role]);

  async function act(payload:Record<string,unknown>,photos:IncidentPhoto[]=[]) {
    setBusy(true);setError("");setNotice("");
    try{const form=new FormData();form.set("payload",JSON.stringify(payload));photos.forEach(photo=>{if(photo.file)form.append("photos",photo.file)});const response=await fetch(`/api/incidents/${incidentId}/actions`,{method:"POST",body:form}),data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error||"No se pudo guardar el cambio.");setComment("");setWorkComment("");setWorkPhotos([]);setInternal(false);setNotice("Cambio guardado correctamente.");await load();}catch(reason){setError(reason instanceof Error?reason.message:"No se pudo guardar el cambio.");}finally{setBusy(false);}
  }

  if(error&&!incident)return <section className="card"><p className="form-error">{error}</p><Link className="btn btn--soft" href={base}>Volver</Link></section>;
  if(!incident||!capabilities)return <section className="card">Cargando incidencia…</section>;
  const photos=[...incident.photos,...incident.updates.flatMap(update=>update.photos??[])];
  return <div className="incident-detail-page">
    <Link className="back-link" href={base}><ArrowLeft/>Volver a incidencias</Link>
    <header className="incident-detail-head"><div><span className="incident-code">{incident.code}</span><h1>{incident.title}</h1><p><Building2/>{incident.towerName} · {incident.area}</p></div><div><IncidentPriorityBadge priority={incident.priority}/><IncidentStatusBadge status={incident.status}/></div></header>
    {notice&&<p className="form-success">{notice}</p>}{error&&<p className="form-error">{error}</p>}
    <div className="incident-detail-layout"><main>
      <section className="incident-panel"><div className="incident-panel__title"><span>Evidencias</span><h2>Galería fotográfica</h2></div>{photos.length?<PhotoGallery photos={photos}/>:<p>Esta incidencia no tiene fotografías.</p>}</section>
      <section className="incident-panel"><div className="incident-panel__title"><span>Información</span><h2>Detalle del hallazgo</h2></div><p className="incident-description">{incident.description}</p><div className="incident-facts"><span><MapPin/><small>Dirección</small><b>{incident.address}</b></span><span><ClipboardCheck/><small>Categoría</small><b>{incident.category}</b></span><span><UserRound/><small>Reportado por</small><b>{incident.reportedBy}</b></span><span><CalendarDays/><small>Fecha</small><b>{new Date(incident.createdAt).toLocaleString("es-DO")}</b></span>{incident.visitId&&<span><Link2/><small>Visita relacionada</small><b>{incident.visitId}</b></span>}</div></section>
      <section className="incident-panel"><div className="incident-panel__title"><span>Seguimiento</span><h2>Historial de actividad</h2></div><IncidentTimeline updates={incident.updates} showInternal={role==="ADMIN"}/></section>
      {capabilities.canComment&&<section className="incident-panel update-composer"><div className="incident-panel__title"><span>Comunicación</span><h2>Añadir seguimiento</h2></div><textarea value={comment} onChange={event=>setComment(event.target.value)} placeholder="Escribe una actualización o comentario…"/>{capabilities.canInternalNote&&<label className="incident-checkbox"><input type="checkbox" checked={internal} onChange={event=>setInternal(event.target.checked)}/> Nota interna, visible solo para administración</label>}<button className="btn btn--primary" disabled={busy||comment.trim().length<2} onClick={()=>act({action:"COMMENT",comment,internal})}><Send/>Guardar comentario</button></section>}
    </main><aside>
      <section className="incident-panel incident-control"><h2>Estado del caso</h2><div className="control-status"><IncidentStatusBadge status={incident.status}/><span>Actualizado {new Date(incident.updatedAt).toLocaleDateString("es-DO")}</span></div><div className="assignee-box"><UserRound/><span><small>Responsable</small><b>{incident.assignedTo??"Sin asignar"}</b></span></div>
        {(capabilities.canAssign||capabilities.canChangePriority)&&<div className="admin-controls">{capabilities.canAssign&&<label>Responsable<select value={assigneeId} onChange={event=>setAssigneeId(event.target.value)}><option value="">Selecciona un responsable</option>{assignees.map(item=><option value={item.id} key={item.id}>{item.first_name} {item.last_name} · {item.role==="INCIDENT_SUPERVISOR"?"Supervisor residente":"Supervisor"}</option>)}</select><button className="btn btn--soft control-action" disabled={busy||!assigneeId} onClick={()=>act({action:"ASSIGN",assignedToId:assigneeId})}><UserCheck/>Asignar responsable</button></label>}{capabilities.canChangePriority&&<label>Prioridad<select value={priority} onChange={event=>setPriority(event.target.value as IncidentPriority)}><option value="LOW">Baja</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select><button className="btn btn--soft control-action" disabled={busy||priority===incident.priority} onClick={()=>act({action:"PRIORITY",priority})}>Actualizar prioridad</button></label>}</div>}
        {capabilities.canStart&&<button className="btn btn--primary control-action" disabled={busy} onClick={()=>act({action:"START"})}><Play/>Iniciar trabajo</button>}
        {capabilities.canComplete&&<div className="incident-work-box"><h3><Wrench/>Registrar trabajo completado</h3><textarea value={workComment} onChange={event=>setWorkComment(event.target.value)} placeholder="Describe el trabajo realizado…"/><IncidentPhotoUploader photos={workPhotos} onChange={setWorkPhotos} type="AFTER"/><button className="btn btn--primary control-action" disabled={busy||workComment.trim().length<3} onClick={()=>act({action:"WORK_COMPLETED",comment:workComment},workPhotos)}>Enviar a verificación</button></div>}
        {capabilities.canVerify&&<div className="incident-verify-box"><h3><ShieldCheck/>Verificar solución</h3><textarea value={workComment} onChange={event=>setWorkComment(event.target.value)} placeholder="Comentario de verificación (obligatorio si requiere corrección)…"/><div><button className="btn btn--soft correction-button" disabled={busy||workComment.trim().length<3} onClick={()=>act({action:"VERIFY",approved:false,comment:workComment})}>Solicitar corrección</button><button className="btn btn--primary" disabled={busy} onClick={()=>act({action:"VERIFY",approved:true,comment:workComment})}>Aprobar solución</button></div></div>}
        {capabilities.canClose&&<div className="incident-close-box"><textarea value={workComment} onChange={event=>setWorkComment(event.target.value)} placeholder="Comentario final de cierre…"/><button className="btn btn--primary control-action" disabled={busy||workComment.trim().length<3} onClick={()=>act({action:"CLOSE",comment:workComment})}><ShieldCheck/>Cerrar incidencia</button></div>}
      </section>
    </aside></div>
  </div>;
}
