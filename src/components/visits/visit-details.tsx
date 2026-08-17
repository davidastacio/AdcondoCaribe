"use client";
import type { Visit } from "@/features/visits/types";
import { CalendarDays, ClipboardCheck, Clock3, Play, RotateCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CancelVisitModal, RescheduleVisitModal } from "./visit-action-modals";
import { VisitStatusBadge } from "./visit-status-badge";

export function VisitDetails({ id }: { id: string }) {
  const [visit, setVisit] = useState<Visit>();
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"reschedule"|"cancel">();
  const load = useCallback(() => fetch(`/api/admin/visits/${id}`, { cache: "no-store" }).then(async response => {
    const data = await response.json() as { visit?: Visit; error?: string };
    if (!response.ok || !data.visit) throw new Error(data.error);
    setVisit(data.visit);
  }).catch(reason => setError(reason instanceof Error ? reason.message : "Visita no encontrada.")), [id]);
  useEffect(() => { void load(); }, [load]);
  if (error) return <section className="card"><p className="form-error">{error}</p></section>;
  if (!visit) return <section className="card">Cargando visita…</section>;
  const facts = [[CalendarDays,"Fecha",visit.scheduledDate],[Clock3,"Hora y duración",`${visit.scheduledTime} · ${visit.estimatedDuration} min`],[ClipboardCheck,"Tipo",visit.visitType??"Supervisión"],[ClipboardCheck,"Checklist",visit.checklistTemplateName??"Pendiente de asignar"],[Play,"Progreso",`${visit.progress}%`]] as const;
  const done = () => { setMode(undefined); void load(); };
  return <><header className="visit-detail-head"><div><small>{visit.code}</small><h1>{visit.towerName}</h1><p>{visit.supervisor} · {visit.scheduledDate} · {visit.scheduledTime}</p></div><VisitStatusBadge status={visit.status}/></header><nav className="visit-detail-actions">{!["COMPLETED","CANCELLED"].includes(visit.status)&&<><button className="btn btn--soft" onClick={()=>setMode("reschedule")}><RotateCw/>Reprogramar</button><button className="btn btn--danger" onClick={()=>setMode("cancel")}><XCircle/>Cancelar</button></>}</nav><div className="visit-detail-grid"><section className="card visit-facts"><h2>Información de la visita</h2>{facts.map(([Icon,label,value])=><article key={label}><Icon/><span><small>{label}</small><b>{value}</b></span></article>)}<p>{visit.notes||"Sin observaciones."}</p></section></div>{mode==="reschedule"&&<RescheduleVisitModal visit={visit} onClose={()=>setMode(undefined)} onDone={done}/>} {mode==="cancel"&&<CancelVisitModal visit={visit} onClose={()=>setMode(undefined)} onDone={done}/>}</>;
}
