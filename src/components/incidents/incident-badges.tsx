import { incidentLabels } from "@/features/incidents/service";
import type { IncidentPriority, IncidentStatus } from "@/features/incidents/types";
export function IncidentStatusBadge({status}:{status:IncidentStatus}){return <span className={`incident-badge incident-badge--status-${status.toLowerCase()}`}><i/>{incidentLabels.status[status]}</span>}
export function IncidentPriorityBadge({priority}:{priority:IncidentPriority}){return <span className={`incident-badge incident-badge--priority-${priority.toLowerCase()}`}>{incidentLabels.priority[priority]}</span>}
