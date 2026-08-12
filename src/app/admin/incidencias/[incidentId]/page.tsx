"use client";
import { IncidentDetail } from "@/components/incidents/incident-detail";
import { useParams } from "next/navigation";
export default function AdminIncidentDetailPage(){const {incidentId}=useParams<{incidentId:string}>();return <IncidentDetail incidentId={incidentId} role="ADMIN"/>}
