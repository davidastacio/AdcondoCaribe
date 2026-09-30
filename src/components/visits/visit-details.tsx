"use client";
import type { Visit } from "@/features/visits/types";
import { AlertTriangle, CalendarDays, ClipboardCheck, Clock3, ExternalLink, ImageIcon, Play, RotateCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CancelVisitModal, RescheduleVisitModal } from "./visit-action-modals";
import { VisitStatusBadge } from "./visit-status-badge";

export function VisitDetails({ id }: { id: string }) {
  type Answer={condition:"OPTIMAL"|"REGULAR"|"BAD"|"NOT_APPLICABLE";observation?:string|null;responsible?:string|null;materialNeeded?:string|null;priority?:string|null;photos:{id:string;url:string}[];incident?:{id:string;code:string;status:string}|null};
  type AdminInspection={status:string;progress:number;startedAt:string;completedAt?:string|null;overallCondition?:string|null;sections:{id:string;title:string;items:{id:string;title:string;instructions:string}[]}[];answers:Record<string,Answer>};
  const [visit, setVisit] = useState<Visit>();
  const [inspection,setInspection]=useState<AdminInspection|null>();
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"reschedule"|"cancel">();
  const load = useCallback(() => fetch(`/api/admin/visits/${id}`, { cache: "no-store" }).then(async response => {
    const data = await response.json() as { visit?: Visit; inspection?:AdminInspection|null; error?: string };
    if (!response.ok || !data.visit) throw new Error(data.error);
    setVisit(data.visit);
    setInspection(data.inspection??null);
  }).catch(reason => setError(reason instanceof Error ? reason.message : "Visita no encontrada.")), [id]);
  useEffect(() => { void load(); }, [load]);
  if (error) return <section className="card"><p className="form-error">{error}</p></section>;
  if (!visit) return <section className="card">Cargando visita…</section>;
  const facts = [[CalendarDays,"Fecha",visit.scheduledDate],[Clock3,"Hora y duración",`${visit.scheduledTime} · ${visit.estimatedDuration} min`],[ClipboardCheck,"Tipo",visit.visitType??"Supervisión"],[ClipboardCheck,"Checklist",visit.checklistTemplateName??"Pendiente de asignar"],[Play,"Progreso",`${visit.progress}%`]] as const;
  const done = () => { setMode(undefined); void load(); };
  const labels={OPTIMAL:"Óptimo",REGULAR:"Regular",BAD:"Mal",NOT_APPLICABLE:"No aplica"};
  const allAnswers=inspection?Object.values(inspection.answers):[];
  const counts={OPTIMAL:allAnswers.filter(a=>a.condition==="OPTIMAL").length,REGULAR:allAnswers.filter(a=>a.condition==="REGULAR").length,BAD:allAnswers.filter(a=>a.condition==="BAD").length,NOT_APPLICABLE:allAnswers.filter(a=>a.condition==="NOT_APPLICABLE").length};
  return <><header className="visit-detail-head"><div><small>{visit.code}</small><h1>{visit.towerName}</h1><p>{visit.supervisor} · {visit.scheduledDate} · {visit.scheduledTime}</p></div><VisitStatusBadge status={visit.status}/></header><nav className="visit-detail-actions">{!["COMPLETED","CANCELLED"].includes(visit.status)&&<><button className="btn btn--soft" onClick={()=>setMode("reschedule")}><RotateCw/>Reprogramar</button><button className="btn btn--danger" onClick={()=>setMode("cancel")}><XCircle/>Cancelar</button></>}</nav><div className="visit-detail-grid"><section className="card visit-facts"><h2>Información de la visita</h2>{facts.map(([Icon,label,value])=><article key={label}><Icon/><span><small>{label}</small><b>{value}</b></span></article>)}<p>{visit.notes||"Sin observaciones."}</p></section>{inspection&&<aside className="card inspection-admin-summary"><h2>Resultado del checklist</h2><div className="condition-totals"><span className="optimal"><b>{counts.OPTIMAL}</b>Óptimos</span><span className="regular"><b>{counts.REGULAR}</b>Regulares</span><span className="bad"><b>{counts.BAD}</b>Mal</span><span className="na"><b>{counts.NOT_APPLICABLE}</b>No aplica</span></div><p>{allAnswers.length} respuestas registradas · {inspection.progress}% completado</p></aside>}</div>{inspection?<section className="card admin-inspection-results"><header><div><small>INSPECCIÓN REALIZADA</small><h2>Respuestas y hallazgos</h2></div><b>{allAnswers.length} puntos</b></header>{inspection.sections.map(section=><div className="admin-inspection-section" key={section.id}><h3>{section.title}</h3>{section.items.map(item=>{const answer=inspection.answers[item.id];return <article key={item.id} className={answer&&["REGULAR","BAD"].includes(answer.condition)?"problem":""}><div><strong>{item.title}</strong><small>{item.instructions}</small>{answer?.observation&&<p>{answer.observation}</p>}{(answer?.responsible||answer?.materialNeeded)&&<em>{answer.responsible&&`Responsable: ${answer.responsible}`}{answer.responsible&&answer.materialNeeded?" · ":""}{answer.materialNeeded&&`Material: ${answer.materialNeeded}`}</em>}</div><aside>{answer?<span className={`condition condition--${answer.condition.toLowerCase()}`}>{labels[answer.condition]}</span>:<span className="condition">Pendiente</span>}{answer?.priority&&<small>Prioridad: {answer.priority}</small>}{answer?.photos?.length>0&&<div className="admin-answer-photos">{answer.photos.map(photo=><a href={photo.url} target="_blank" rel="noreferrer" key={photo.id}><ImageIcon/> Evidencia</a>)}</div>}{answer?.incident&&<Link href={`/admin/incidencias/${answer.incident.id}`}><AlertTriangle/>{answer.incident.code}<ExternalLink/></Link>}</aside></article>})}</div>)}</section>:<section className="card admin-inspection-results"><p>Esta visita todavía no tiene una inspección iniciada.</p></section>}{mode==="reschedule"&&<RescheduleVisitModal visit={visit} onClose={()=>setMode(undefined)} onDone={done}/>} {mode==="cancel"&&<CancelVisitModal visit={visit} onClose={()=>setMode(undefined)} onDone={done}/>}</>;
}
