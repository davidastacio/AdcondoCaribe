"use client";

import { VisitStatusBadge } from "@/components/visits/visit-status-badge";
import type { Visit } from "@/features/visits/types";
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, Clock3, MapPin, Play, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StartVisitPage() {
  const { visitId } = useParams<{ visitId: string }>();
  const router = useRouter();
  const [visit, setVisit] = useState<Visit>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/supervisor/visits/${visitId}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { visit?: Visit; error?: string };
        if (!response.ok || !data.visit) throw new Error(data.error ?? "No se pudo cargar la visita.");
        setVisit(data.visit);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudo cargar la visita."));
  }, [visitId]);

  const start = async () => {
    if (!visit) return;
    if (visit.status === "IN_PROGRESS" || visit.status === "COMPLETED") {
      router.push(`/supervisor/visitas/${visit.id}/inspeccion`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/supervisor/visits/${visit.id}`, { method: "POST" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar la visita.");
      router.push(`/supervisor/visitas/${visit.id}/inspeccion`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar la visita.");
      setLoading(false);
    }
  };

  if (error && !visit) return <section className="card"><p className="form-error">{error}</p><Link className="btn btn--soft" href="/supervisor/visitas">Volver a mis visitas</Link></section>;
  if (!visit) return <div className="inspection-loading">Preparando visita...</div>;
  const canStart = ["SCHEDULED", "RESCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(visit.status);
  const action = visit.status === "IN_PROGRESS" ? "Continuar inspección" : visit.status === "COMPLETED" ? "Ver inspección" : "Confirmar inicio de visita";

  return <div className="start-visit-page"><Link className="back-link" href="/supervisor/visitas"><ArrowLeft/>Volver a mis visitas</Link><section className="start-visit-card"><div className="start-visit-icon"><ShieldCheck/></div><span className="start-eyebrow">{visit.status === "IN_PROGRESS" ? "Visita en progreso" : "Confirmación de visita"}</span><h1>{visit.status === "IN_PROGRESS" ? "Continúa donde lo dejaste" : visit.status === "COMPLETED" ? "Inspección completada" : "¿Listo para iniciar?"}</h1><p>{visit.status === "SCHEDULED" || visit.status === "RESCHEDULED" ? <>Al confirmar, la visita cambiará a <strong>En progreso</strong> y comenzaremos a registrar el tiempo.</> : "Puedes consultar el checklist y el progreso registrado para esta visita."}</p><div className="start-tower"><Building2/><div><strong>{visit.towerName}</strong><span>{visit.towerCode}</span></div><VisitStatusBadge status={visit.status}/></div><div className="start-details"><span><MapPin/><small>Dirección</small><strong>{visit.address}</strong></span><span><CalendarDays/><small>Fecha</small><strong>{new Date(`${visit.scheduledDate}T12:00:00`).toLocaleDateString("es-DO",{weekday:"long",day:"numeric",month:"long"})}</strong></span><span><Clock3/><small>Hora programada</small><strong>{visit.scheduledTime}</strong></span><span><UserRound/><small>Supervisor</small><strong>{visit.supervisor}</strong></span></div><div className="start-note"><CheckCircle2/>El progreso se guardará en la plataforma después de cada respuesta.</div>{error&&<p className="form-error">{error}</p>}<button className="btn btn--primary start-button" onClick={start} disabled={loading||!canStart}><Play/>{loading?"Iniciando...":canStart?action:"Visita no disponible"}</button></section></div>;
}
