"use client";
import type { InspectionAnswerData, ChecklistItemData, AnswerCondition, Priority } from "@/features/visits/types";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ConditionSelector } from "./condition-selector";
import { IncidentButton } from "./incident-button";
import { PhotoUploader } from "./photo-uploader";

export function ChecklistItem({item,answer,onChange}:{item:ChecklistItemData;answer?:InspectionAnswerData;onChange:(answer:InspectionAnswerData)=>void}){
  const {visitId}=useParams<{visitId:string}>();
  const update=(patch:Partial<InspectionAnswerData>)=>onChange({...answer,...patch,condition:(patch.condition??answer?.condition) as AnswerCondition,updatedAt:new Date().toISOString()});
  const needsDetail=answer?.condition==="REGULAR"||answer?.condition==="BAD";
  return <article className={`check-item ${answer?"answered":""} ${needsDetail?"has-problem":""}`}><div className="check-item__head"><span><strong>{item.title}</strong><small>{item.instructions}</small></span>{answer&&<CheckCircle2/>}</div><ConditionSelector value={answer?.condition} onChange={condition=>update({condition})}/>{needsDetail&&<div className="problem-fields"><label>Observación<textarea value={answer?.observation??""} onChange={e=>update({observation:e.target.value})} placeholder="Describe la condición encontrada..."/></label><div><span className="field-label">Fotografía</span><PhotoUploader photos={answer?.photos??[]} onChange={photos=>update({photos})}/></div><label>Responsable<input value={answer?.responsible??""} onChange={e=>update({responsible:e.target.value})} placeholder="Persona o empresa responsable"/></label><label>Material necesario<input value={answer?.materialNeeded??""} onChange={e=>update({materialNeeded:e.target.value})} placeholder="Indica qué material se necesita"/></label><label>Prioridad<select value={answer?.priority??"MEDIUM"} onChange={e=>update({priority:e.target.value as Priority})}><option value="LOW">Baja</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></label><div><IncidentButton checked={answer?.createIncident??false} onChange={createIncident=>update({createIncident})}/>{answer?.createIncident&&<Link className="create-linked-incident" href={`/supervisor/incidencias/nueva?visitId=${visitId}&answerId=${item.id}&checklistItem=${encodeURIComponent(item.title)}&title=${encodeURIComponent(item.title)}&priority=${answer.priority??"MEDIUM"}`}>Completar reporte de incidencia →</Link>}</div></div>}</article>
}
