import { formatTimelineDate } from "@/features/incidents/format";
import type { IncidentUpdate } from "@/features/incidents/types";
import { AlertTriangle, CheckCircle2, Clock3, MessageSquareText, UserCheck } from "lucide-react";

const icons={CREATED:AlertTriangle,COMMENT:MessageSquareText,ASSIGNED:UserCheck,STATUS_CHANGED:Clock3,WORK_COMPLETED:CheckCircle2,VERIFIED:CheckCircle2,CORRECTION_REQUIRED:AlertTriangle,INTERNAL_NOTE:MessageSquareText};

export function IncidentTimeline({updates,showInternal=false}:{updates:IncidentUpdate[];showInternal?:boolean}){
 const visible=updates.filter(update=>showInternal||!update.internal).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
 return <div className="incident-timeline">{visible.map(update=>{const Icon=icons[update.type];return <article key={update.id} className={`timeline-entry timeline-entry--${update.type.toLowerCase()}`}><span className="timeline-icon"><Icon/></span><div><header><strong>{update.userName}</strong><small>{update.userRole}</small><time>{formatTimelineDate(update.createdAt)}</time></header><p>{update.comment}</p>{update.oldStatus&&update.newStatus&&<span className="timeline-change">{update.oldStatus.replaceAll("_"," ")} → {update.newStatus.replaceAll("_"," ")}</span>}{update.photos&&update.photos.length>0&&<small>{update.photos.length} fotografía(s) adjunta(s)</small>}</div></article>})}</div>
}
