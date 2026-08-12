"use client";
import { VisitStatusBadge } from "@/components/visits/visit-status-badge";
import { getVisit } from "@/features/visits/mock-data";
import { readInspection, saveInspection, saveVisitStatus } from "@/features/visits/storage";
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, Clock3, MapPin, Play, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function StartVisitPage(){
  const {visitId}=useParams<{visitId:string}>(); const visit=getVisit(visitId); const router=useRouter(); const [loading,setLoading]=useState(false);
  const start=()=>{setLoading(true);const existing=readInspection(visit.id);if(!existing)saveInspection({visitId:visit.id,startedAt:new Date().toISOString(),startedBy:"Juan Rodríguez",answers:{}});saveVisitStatus(visit.id,"IN_PROGRESS");router.push(`/supervisor/visitas/${visit.id}/inspeccion`)};
  return <div className="start-visit-page"><Link className="back-link" href="/supervisor/visitas"><ArrowLeft/>Volver a mis visitas</Link><section className="start-visit-card"><div className="start-visit-icon"><ShieldCheck/></div><span className="start-eyebrow">Confirmación de visita</span><h1>¿Listo para iniciar?</h1><p>Al confirmar, la visita cambiará a <strong>En progreso</strong> y comenzaremos a registrar el tiempo.</p><div className="start-tower"><Building2/><div><strong>{visit.towerName}</strong><span>{visit.towerCode}</span></div><VisitStatusBadge status="SCHEDULED"/></div><div className="start-details"><span><MapPin/><small>Dirección</small><strong>{visit.address}</strong></span><span><CalendarDays/><small>Fecha</small><strong>{new Date(`${visit.scheduledDate}T12:00:00`).toLocaleDateString("es-DO",{weekday:"long",day:"numeric",month:"long"})}</strong></span><span><Clock3/><small>Hora programada</small><strong>{visit.scheduledTime}</strong></span><span><UserRound/><small>Supervisor</small><strong>{visit.supervisor}</strong></span></div><div className="start-note"><CheckCircle2/>El progreso se guardará automáticamente después de cada respuesta.</div><button className="btn btn--primary start-button" onClick={start} disabled={loading}><Play/>{loading?"Iniciando...":"Confirmar inicio de visita"}</button></section></div>
}
