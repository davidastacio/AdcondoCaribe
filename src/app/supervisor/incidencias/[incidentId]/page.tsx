"use client";
import { IncidentDetail } from "@/components/incidents/incident-detail";
import { useParams } from "next/navigation";
export default function SupervisorIncidentDetailPage(){const {incidentId}=useParams<{incidentId:string}>();return <IncidentDetail incidentId={incidentId} role="SUPERVISOR"/>}
