"use client";

import { ChecklistSection } from "@/components/inspection/checklist-section";
import { MobileInspectionNav } from "@/components/inspection/mobile-inspection-nav";
import { InspectionProgress } from "@/components/visits/inspection-progress";
import type { ChecklistSectionData, InspectionAnswerData, Visit } from "@/features/visits/types";
import { AlertTriangle, ArrowLeft, Building2, Camera, Check, CheckCircle2, Clock3, FileCheck2, MapPin, Save, ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type InspectionPayload = { id: string; startedAt: string; status: string; progress: number; sections: ChecklistSectionData[]; answers: Record<string, InspectionAnswerData> };

export default function InspectionPage() {
  const { visitId } = useParams<{ visitId: string }>();
  const router = useRouter();
  const [visit, setVisit] = useState<Visit>();
  const [inspection, setInspection] = useState<InspectionPayload>();
  const [finishOpen, setFinishOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saveState, setSaveState] = useState<"saved"|"saving"|"error">("saved");
  const [error, setError] = useState("");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    const [visitResponse, inspectionResponse] = await Promise.all([
      fetch(`/api/supervisor/visits/${visitId}`, { cache: "no-store" }),
      fetch(`/api/supervisor/visits/${visitId}/inspection`, { cache: "no-store" }),
    ]);
    const visitData = await visitResponse.json() as { visit?: Visit; error?: string };
    const inspectionData = await inspectionResponse.json() as { inspection?: InspectionPayload; error?: string };
    if (!visitResponse.ok || !visitData.visit) throw new Error(visitData.error ?? "Visita no encontrada.");
    if (!inspectionResponse.ok || !inspectionData.inspection) throw new Error(inspectionData.error ?? "Primero debes iniciar la visita.");
    setVisit(visitData.visit);
    setInspection(inspectionData.inspection);
  }, [visitId]);

  useEffect(() => {
    const pendingTimers = timers.current;
    void load().catch(reason => setError(reason instanceof Error ? reason.message : "No se pudo cargar la inspección."));
    return () => Object.values(pendingTimers).forEach(clearTimeout);
  }, [load]);

  const persistAnswer = async (itemId: string, answer: InspectionAnswerData) => {
    setSaveState("saving");
    try {
      const response = await fetch(`/api/supervisor/visits/${visitId}/inspection`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "ANSWER", itemId, condition: answer.condition, observation: answer.observation, responsible: answer.responsible, materialNeeded: answer.materialNeeded, priority: answer.priority }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la respuesta.");
      setSaveState("saved");
    } catch (reason) {
      setSaveState("error");
      setError(reason instanceof Error ? reason.message : "No se pudo guardar la respuesta.");
    }
  };

  const updateAnswer = (itemId: string, answer: InspectionAnswerData) => {
    setInspection(previous => previous ? { ...previous, answers: { ...previous.answers, [itemId]: answer } } : previous);
    setError("");
    clearTimeout(timers.current[itemId]);
    timers.current[itemId] = setTimeout(() => void persistAnswer(itemId, answer), 550);
  };

  if (error && !inspection) return <section className="card"><p className="form-error">{error}</p><Link className="btn btn--soft" href={`/supervisor/visitas/${visitId}`}>Volver a la visita</Link></section>;
  if (!visit || !inspection) return <div className="inspection-loading">Preparando inspección...</div>;

  const answers = Object.values(inspection.answers);
  const total = inspection.sections.reduce((sum, section) => sum + section.items.length, 0);
  const completed = answers.length;
  const pending = total - completed;
  const problemCount = answers.filter(answer => answer.condition === "REGULAR" || answer.condition === "BAD").length;
  const photos = answers.reduce((sum, answer) => sum + (answer.photos?.length ?? 0), 0);
  const stats = { optimal: answers.filter(a=>a.condition==="OPTIMAL").length, regular: answers.filter(a=>a.condition==="REGULAR").length, bad: answers.filter(a=>a.condition==="BAD").length, na: answers.filter(a=>a.condition==="NOT_APPLICABLE").length };

  const confirmFinish = async () => {
    if (!confirmed || pending > 0) return;
    setError("");
    const response = await fetch(`/api/supervisor/visits/${visitId}/inspection`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "FINISH" }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setError(data.error ?? "No se pudo finalizar la visita."); return; }
    router.push("/supervisor/visitas");
    router.refresh();
  };

  const readonly = inspection.status === "COMPLETED" || visit.status === "COMPLETED";
  return <div className="inspection-page"><header className="inspection-header"><Link href="/supervisor/visitas"><ArrowLeft/></Link><div><span>{readonly?"Inspección completada":"Inspección en progreso"}</span><h1>{visit.towerName}</h1><p><MapPin/>{visit.sector} · Iniciada: {new Date(inspection.startedAt).toLocaleTimeString("es-DO",{hour:"2-digit",minute:"2-digit"})}</p></div><div className={`autosave ${saveState==="saved"?"active":""}`}><Save/>{saveState==="saving"?"Guardando...":saveState==="error"?"Error al guardar":"Guardado automático"}</div></header><div className="inspection-layout"><aside id="summary" className="inspection-sidebar"><div className="inspection-tower-card"><Building2/><span><small>{visit.towerCode}</small><strong>{visit.towerName}</strong><p>{visit.address}</p></span></div><InspectionProgress completed={completed} total={total}/><div className="inspection-metrics"><span><CheckCircle2/><b>{completed}</b><small>Verificados</small></span><span><ShieldAlert/><b>{problemCount}</b><small>Problemas</small></span><span><Camera/><b>{photos}</b><small>Fotos locales</small></span></div><div className="inspection-info"><span><Clock3/>Iniciada <b>{new Date(inspection.startedAt).toLocaleTimeString("es-DO",{hour:"2-digit",minute:"2-digit"})}</b></span><span><FileCheck2/>Supervisor <b>{visit.supervisor}</b></span></div>{!readonly&&<button className="btn btn--primary desktop-finish" onClick={()=>setFinishOpen(true)}><Check/>Finalizar visita</button>}</aside><main id="checklist" className="inspection-checklist"><div className="inspection-checklist__heading"><div><span>Checklist de supervisión</span><h2>Recorrido por áreas</h2><p>Selecciona la condición de cada punto. Tus respuestas se guardan automáticamente.</p></div><b>{completed}/{total}</b></div>{error&&<p className="form-error">{error}</p>}{inspection.sections.map((section,index)=><ChecklistSection key={section.id} section={section} answers={inspection.answers} onAnswer={readonly?()=>undefined:updateAnswer} defaultOpen={index===0}/>)}</main></div>{!readonly&&<MobileInspectionNav onFinish={()=>setFinishOpen(true)}/>} {finishOpen&&<div className="finish-overlay"><section className="finish-modal"><button className="finish-close" onClick={()=>setFinishOpen(false)}><X/></button>{pending>0?<><span className="finish-icon finish-icon--warning"><AlertTriangle/></span><h2>Inspección incompleta</h2><p>Todavía tienes <strong>{pending} puntos pendientes</strong>. Debes responder todos los puntos antes de finalizar.</p><InspectionProgress completed={completed} total={total} compact/><button className="btn btn--primary" onClick={()=>{setFinishOpen(false);document.getElementById("checklist")?.scrollIntoView({behavior:"smooth"})}}>Ir a pendientes</button></>:<><span className="finish-icon"><CheckCircle2/></span><h2>Supervisión completada</h2><div className="finish-summary"><span><small>Torre</small><b>{visit.towerName}</b></span><span><small>Supervisor</small><b>{visit.supervisor}</b></span><span><small>Hora de inicio</small><b>{new Date(inspection.startedAt).toLocaleTimeString("es-DO",{hour:"2-digit",minute:"2-digit"})}</b></span><span><small>Total de puntos</small><b>{total}</b></span></div><div className="condition-totals"><span className="optimal"><b>{stats.optimal}</b>Óptimos</span><span className="regular"><b>{stats.regular}</b>Regulares</span><span className="bad"><b>{stats.bad}</b>Mal</span><span className="na"><b>{stats.na}</b>No aplica</span></div>{error&&<p className="form-error">{error}</p>}<label className="finish-confirm"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/><span>Confirmo que he completado esta supervisión.</span></label><button className="btn btn--primary" disabled={!confirmed||saveState==="saving"} onClick={()=>void confirmFinish()}><Check/>Finalizar visita</button></>}</section></div>}</div>;
}
