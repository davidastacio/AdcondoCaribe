import type { Visit, VisitStatus } from "@/features/visits/types";
import { Building2, CalendarDays, Clock3, MapPin, Play, RotateCw, UserRound } from "lucide-react";
import Link from "next/link";
import { VisitStatusBadge } from "./visit-status-badge";

export function VisitCard({visit,status=visit.status}:{visit:Visit;status?:VisitStatus}){
  const action = status === "IN_PROGRESS" ? "Continuar visita" : status === "COMPLETED" ? "Ver reporte" : status === "RESCHEDULED" ? "Ver nueva fecha" : status === "CANCELLED" ? "Ver detalle" : "Iniciar visita";
  const href=["IN_PROGRESS","COMPLETED"].includes(status)?`/supervisor/visitas/${visit.id}/inspeccion`:`/supervisor/visitas/${visit.id}`;
  return <article className="visit-card"><div className="visit-card__top"><div className="visit-building"><Building2/><span><strong>{visit.towerName}</strong><small>{visit.towerCode}</small></span></div><VisitStatusBadge status={status}/></div><div className="visit-card__meta"><span><MapPin/>{visit.sector}<small>{visit.address}</small></span><span><CalendarDays/>{new Date(`${visit.scheduledDate}T12:00:00`).toLocaleDateString("es-DO",{day:"numeric",month:"short",year:"numeric"})}</span><span><Clock3/>{visit.scheduledTime}</span><span><UserRound/>{visit.supervisor}</span></div><div className="visit-card__progress"><div><span>Progreso del checklist</span><b>{status==="COMPLETED"?100:visit.progress}%</b></div><div><i style={{width:`${status==="COMPLETED"?100:visit.progress}%`}}/></div></div>{visit.rescheduledTo&&<p className="rescheduled-note"><RotateCw/>Nueva fecha: <strong>{visit.rescheduledTo}</strong></p>}<Link className={`visit-card__action visit-card__action--${status.toLowerCase()}`} href={href}><Play/>{action}</Link></article>
}
