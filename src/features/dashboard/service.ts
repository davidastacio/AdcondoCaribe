"use client";
import { listTowers } from "@/features/towers/service";
import { listUsers, listAssignments } from "@/features/users/service";
import { listVisits } from "@/features/visits/service";
import { listIncidents } from "@/features/incidents/service";
import { listRequests } from "@/features/inventory/service";

const openIncident = (status:string) => !["RESOLVED","CLOSED"].includes(status);
const pendingRequest = (status:string) => !["REJECTED","DELIVERED"].includes(status);
export function getAdminDashboardData(referenceDate = new Date().toISOString().slice(0,10)) {
  const towers=listTowers(), users=listUsers(), visits=listVisits(), incidents=listIncidents(), requests=listRequests();
  const today=visits.filter(x=>x.scheduledDate===referenceDate);
  return { towers, users, visits, incidents, requests, metrics:{ totalTowers:towers.length, activeTowers:towers.filter(x=>x.status==="ACTIVE").length, activeSupervisors:users.filter(x=>(x.role==="SUPERVISOR"||x.role==="INCIDENT_SUPERVISOR")&&x.status==="ACTIVE").length, visitsToday:today.length, completedVisits:today.filter(x=>x.status==="COMPLETED").length, pendingVisits:today.filter(x=>["SCHEDULED","RESCHEDULED"].includes(x.status)).length, openIncidents:incidents.filter(x=>openIncident(x.status)).length, criticalIncidents:incidents.filter(x=>openIncident(x.status)&&x.priority==="CRITICAL").length, pendingRequests:requests.filter(x=>pendingRequest(x.status)).length } };
}
export function getSupervisorDashboardData(userId:string, referenceDate = new Date().toISOString().slice(0,10)) {
  const assignments=listAssignments().filter(x=>x.supervisorId===userId&&x.status==="ACTIVE"), towerIds=assignments.map(x=>x.towerId);
  const towers=listTowers().filter(x=>towerIds.includes(x.id));
  const visits=listVisits().filter(x=>x.supervisorId===userId), today=visits.filter(x=>x.scheduledDate===referenceDate);
  const incidents=listIncidents().filter(x=>towerIds.includes(x.towerId)&&(x.reportedById===userId||openIncident(x.status)));
  const requests=listRequests().filter(x=>x.requestedById===userId);
  return { towers, visits, today, incidents, requests, metrics:{ assignedTowers:towers.length, completed:today.filter(x=>x.status==="COMPLETED").length, inProgress:today.filter(x=>x.status==="IN_PROGRESS").length, pending:today.filter(x=>["SCHEDULED","RESCHEDULED"].includes(x.status)).length, openIncidents:incidents.filter(x=>openIncident(x.status)).length, ownRequests:requests.length } };
}
