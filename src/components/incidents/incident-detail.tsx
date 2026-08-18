"use client";
import type { Incident } from "@/features/incidents/types";
import { ArrowLeft,Building2,CalendarDays,ClipboardCheck,Link2,MapPin,UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect,useState } from "react";
import { IncidentPriorityBadge,IncidentStatusBadge } from "./incident-badges";
import { IncidentTimeline } from "./incident-timeline";
import { PhotoGallery } from "./photo-gallery";

export function IncidentDetail({incidentId,role}:{incidentId:string;role:"ADMIN"|"SUPERVISOR"|"INCIDENT_SUPERVISOR"}){
  const [incident,setIncident]=useState<Incident>(),[error,setError]=useState("");
  useEffect(()=>{fetch(`/api/incidents/${incidentId}`,{cache:"no-store"}).then(async response=>{const data=await response.json() as {incident?:Incident;error?:string};if(!response.ok||!data.incident)throw new Error(data.error);setIncident(data.incident)}).catch(reason=>setError(reason instanceof Error?reason.message:"Incidencia no encontrada."))},[incidentId]);
  const base=role==="ADMIN"?"/admin/incidencias":"/supervisor/incidencias";
  if(error)return <section className="card"><p className="form-error">{error}</p><Link className="btn btn--soft" href={base}>Volver</Link></section>;
  if(!incident)return <section className="card">Cargando incidencia…</section>;
  const photos=[...incident.photos,...incident.updates.flatMap(update=>update.photos??[])];
  return <div className="incident-detail-page"><Link className="back-link" href={base}><ArrowLeft/>Volver a incidencias</Link><header className="incident-detail-head"><div><span className="incident-code">{incident.code}</span><h1>{incident.title}</h1><p><Building2/>{incident.towerName} · {incident.area}</p></div><div><IncidentPriorityBadge priority={incident.priority}/><IncidentStatusBadge status={incident.status}/></div></header><div className="incident-detail-layout"><main><section className="incident-panel"><div className="incident-panel__title"><span>Evidencias</span><h2>Galería fotográfica</h2></div>{photos.length?<PhotoGallery photos={photos}/>:<p>Esta incidencia no tiene fotografías.</p>}</section><section className="incident-panel"><div className="incident-panel__title"><span>Información</span><h2>Detalle del hallazgo</h2></div><p className="incident-description">{incident.description}</p><div className="incident-facts"><span><MapPin/><small>Dirección</small><b>{incident.address}</b></span><span><ClipboardCheck/><small>Categoría</small><b>{incident.category}</b></span><span><UserRound/><small>Reportado por</small><b>{incident.reportedBy}</b></span><span><CalendarDays/><small>Fecha</small><b>{new Date(incident.createdAt).toLocaleString("es-DO")}</b></span>{incident.visitId&&<span><Link2/><small>Visita relacionada</small><b>{incident.visitId}</b></span>}</div></section><section className="incident-panel"><div className="incident-panel__title"><span>Seguimiento</span><h2>Historial de actividad</h2></div><IncidentTimeline updates={incident.updates} showInternal={role==="ADMIN"}/></section></main><aside><section className="incident-panel incident-control"><h2>Estado del caso</h2><div className="control-status"><IncidentStatusBadge status={incident.status}/><span>Actualizado {new Date(incident.updatedAt).toLocaleDateString("es-DO")}</span></div><div className="assignee-box"><UserRound/><span><small>Responsable</small><b>{incident.assignedTo??"Sin asignar"}</b></span></div></section></aside></div></div>;
}
