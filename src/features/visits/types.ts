export type VisitStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "RESCHEDULED" | "CANCELLED";
export type AnswerCondition = "OPTIMAL" | "REGULAR" | "BAD" | "NOT_APPLICABLE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Visit {
  id: string;
  code?: string;
  towerId?: string;
  supervisorId?: string;
  towerName: string;
  towerCode: string;
  sector: string;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  status: VisitStatus;
  supervisor: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  rescheduledTo?: string;
  estimatedDuration?: number;
  visitType?: string;
  visitTypeId?: string;
  checklistTemplateId?: string;
  checklistTemplateName?: string;
  notes?: string;
  priority?: "LOW"|"MEDIUM"|"HIGH";
  recurrence?: "ONCE"|"WEEKLY"|"BIWEEKLY"|"MONTHLY";
  cancelledAt?: string;
  cancellationReason?: string;
  createdById?: string;
}
export interface VisitScheduleHistory{id:string;visitId:string;previousDate?:string;previousTime?:string;newDate:string;newTime:string;reason:string;changedById:string;changedBy:string;createdAt:string}
export interface VisitActivity{id:string;visitId:string;action:string;user:string;createdAt:string;detail?:string}
export type VisitInput=Pick<Visit,"towerId"|"towerName"|"towerCode"|"sector"|"address"|"supervisorId"|"supervisor"|"scheduledDate"|"scheduledTime"|"estimatedDuration"|"visitType"|"visitTypeId"|"checklistTemplateId"|"checklistTemplateName"|"notes"|"priority"|"recurrence">;

export interface ChecklistItemData {
  id: string;
  title: string;
  instructions: string;
  required?: boolean;
}

export interface ChecklistSectionData {
  id: string;
  title: string;
  items: ChecklistItemData[];
}

export interface InspectionAnswerData {
  condition: AnswerCondition;
  observation?: string;
  responsible?: string;
  materialNeeded?: string;
  priority?: Priority;
  createIncident?: boolean;
  photos?: { id: string; url: string }[];
  updatedAt: string;
}

export interface InspectionState {
  visitId: string;
  startedAt: string;
  startedBy: string;
  answers: Record<string, InspectionAnswerData>;
  generalObservation?: string;
  completedAt?: string;
}
