import type { AnswerCondition } from "@/features/visits/types";
import { Ban, Check, X, Zap } from "lucide-react";

const choices = [{value:"OPTIMAL",label:"Óptimo",icon:Check},{value:"REGULAR",label:"Regular",icon:Zap},{value:"BAD",label:"Mal",icon:X},{value:"NOT_APPLICABLE",label:"No aplica",icon:Ban}] as const;
export function ConditionSelector({value,onChange}:{value?:AnswerCondition;onChange:(value:AnswerCondition)=>void}){
  return <div className="condition-selector">{choices.map(({value:choice,label,icon:Icon})=><button type="button" key={choice} className={`${choice.toLowerCase()} ${value===choice?"selected":""}`} onClick={()=>onChange(choice)}><Icon/>{label}</button>)}</div>
}
