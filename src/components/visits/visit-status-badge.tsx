import type { VisitStatus } from "@/features/visits/types";

const labels: Record<VisitStatus,string> = { SCHEDULED:"Programada", IN_PROGRESS:"En progreso", COMPLETED:"Completada", RESCHEDULED:"Reprogramada", CANCELLED:"Cancelada" };
const tones: Record<VisitStatus,string> = { SCHEDULED:"blue", IN_PROGRESS:"orange", COMPLETED:"green", RESCHEDULED:"purple", CANCELLED:"gray" };

export function VisitStatusBadge({status}:{status:VisitStatus}){
  return <span className={`visit-status visit-status--${tones[status]}`}><i/>{labels[status]}</span>;
}
