"use client";
import type { ChecklistSectionData, InspectionAnswerData } from "@/features/visits/types";
import { AlertTriangle, CheckCircle2, ChevronDown, Circle } from "lucide-react";
import { useState } from "react";
import { ChecklistItem } from "./checklist-item";

export function ChecklistSection({section,answers,onAnswer,defaultOpen=false}:{section:ChecklistSectionData;answers:Record<string,InspectionAnswerData>;onAnswer:(itemId:string,answer:InspectionAnswerData)=>void;defaultOpen?:boolean}){
  const [open,setOpen]=useState(defaultOpen); const completed=section.items.filter(item=>answers[item.id]).length; const problems=section.items.filter(item=>answers[item.id]?.condition==="BAD"||answers[item.id]?.condition==="REGULAR").length; const done=completed===section.items.length;
  return <section className={`check-section ${open?"open":""}`}><button type="button" className="check-section__toggle" onClick={()=>setOpen(!open)}><span className={`section-state ${done?"done":problems?"warning":"pending"}`}>{done?<CheckCircle2/>:problems?<AlertTriangle/>:<Circle/>}</span><span><strong>{section.title}</strong><small>{completed}/{section.items.length} verificados {problems>0&&<>· <b>{problems} {problems===1?"problema":"problemas"}</b></>}</small></span><ChevronDown/></button>{open&&<div className="check-section__content">{section.items.map(item=><ChecklistItem key={item.id} item={item} answer={answers[item.id]} onChange={answer=>onAnswer(item.id,answer)}/>)}</div>}</section>
}
