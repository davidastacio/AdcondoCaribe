"use client";
import { VisitCard } from "@/components/visits/visit-card";
import { listVisits } from "@/features/visits/service";
import { readVisitStatus } from "@/features/visits/storage";
import type { VisitStatus } from "@/features/visits/types";
import { CalendarDays, CheckCircle2, Clock3, ListFilter, RotateCw, Search } from "lucide-react";
import { useEffect, useState } from "react";

type Filter="ALL"|"TODAY"|VisitStatus;
const filters:[Filter,string][]=[["ALL","Todas"],["TODAY","Hoy"],["SCHEDULED","Pendientes"],["IN_PROGRESS","En progreso"],["COMPLETED","Completadas"],["RESCHEDULED","Reprogramadas"]];

export default function VisitsPage(){
  const visits=listVisits().filter(v=>v.supervisorId==="usr-juan"||v.supervisor==="Juan Rodríguez");
  const [filter,setFilter]=useState<Filter>("ALL"); const [query,setQuery]=useState(""); const [date,setDate]=useState(""); const [statuses,setStatuses]=useState<Record<string,VisitStatus>>({});
  // El repositorio local se hidrata una sola vez al abrir la agenda.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>setStatuses(Object.fromEntries(visits.map(v=>[v.id,readVisitStatus(v.id,v.status)]))),[]);
  const current=(id:string,fallback:VisitStatus)=>statuses[id]??fallback;
  const shown=visits.filter(v=>{const status=current(v.id,v.status);const term=query.toLocaleLowerCase("es");const search=!term||`${v.towerName} ${v.towerCode} ${v.sector}`.toLocaleLowerCase("es").includes(term);const byDate=!date||v.scheduledDate===date;const byFilter=filter==="ALL"||(filter==="TODAY"&&v.scheduledDate==="2026-08-11")||status===filter;return search&&byDate&&byFilter});
  const count=(status:VisitStatus)=>visits.filter(v=>current(v.id,v.status)===status).length;
  return <div className="visits-page"><div className="dashboard-heading visits-heading"><div><span className="mobile-overline">Agenda personal</span><h1>Mis visitas</h1><p>Gestiona tus visitas programadas y continúa inspecciones pendientes.</p></div><button className="date-pill"><CalendarDays/> Martes, 11 de agosto</button></div><section className="visit-summary"><article><CalendarDays/><span><b>{visits.filter(v=>v.scheduledDate==="2026-08-11").length}</b>Visitas de hoy</span></article><article><Clock3/><span><b>{count("SCHEDULED")}</b>Pendientes</span></article><article><CheckCircle2/><span><b>{count("COMPLETED")}</b>Completadas</span></article><article><RotateCw/><span><b>{count("RESCHEDULED")}</b>Reprogramadas</span></article></section><section className="visit-toolbar"><div className="visit-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por torre, sector o código..."/></div><label className="visit-date"><CalendarDays/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></section><div className="visit-filters"><ListFilter/>{filters.map(([value,label])=><button key={value} onClick={()=>setFilter(value)} className={filter===value?"active":""}>{label}</button>)}</div><section className="visit-card-grid">{shown.map(visit=><VisitCard key={visit.id} visit={visit} status={current(visit.id,visit.status)}/>)}</section>{shown.length===0&&<div className="visits-empty"><Search/><h2>No encontramos visitas</h2><p>Prueba cambiando la búsqueda o los filtros seleccionados.</p></div>}</div>
}
