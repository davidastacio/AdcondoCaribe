export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "PENDING_VERIFICATION" | "RESOLVED" | "CLOSED";
export type IncidentPhotoType = "BEFORE" | "AFTER" | "GENERAL";
export type IncidentUpdateType = "CREATED" | "COMMENT" | "ASSIGNED" | "STATUS_CHANGED" | "WORK_COMPLETED" | "VERIFIED" | "CORRECTION_REQUIRED" | "INTERNAL_NOTE";

export interface IncidentPhoto { id:string; url:string; type:IncidentPhotoType; createdAt:string; incidentUpdateId?:string }
export interface IncidentUpdate { id:string; userId:string; userName:string; userRole:string; type:IncidentUpdateType; comment:string; oldStatus?:IncidentStatus; newStatus?:IncidentStatus; photos?:IncidentPhoto[]; createdAt:string; internal?:boolean }
export interface Incident {
  id:string; code:string; towerId:string; towerName:string; towerCode:string; address:string; sector:string;
  visitId?:string; inspectionId?:string; inspectionAnswerId?:string; checklistItem?:string;
  reportedById:string; reportedBy:string; assignedToId?:string; assignedTo?:string; assigneeType?:"INTERNAL"|"EXTERNAL";
  area:string; category:string; title:string; description:string; observation?:string;
  priority:IncidentPriority; status:IncidentStatus; photos:IncidentPhoto[]; updates:IncidentUpdate[];
  createdAt:string; updatedAt:string; resolvedAt?:string; closedAt?:string;
}

export interface NewIncidentInput { towerId:string; towerName:string; towerCode:string; address:string; sector:string; area:string; category:string; title:string; description:string; observation?:string; priority:IncidentPriority; assignedTo?:string; photos:IncidentPhoto[]; visitId?:string; inspectionId?:string; inspectionAnswerId?:string; checklistItem?:string }
