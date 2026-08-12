"use client";
import type { InspectionState, VisitStatus } from "./types";

const inspectionKey = (visitId:string) => `adcondo:inspection:${visitId}`;
const statusKey = (visitId:string) => `adcondo:visit-status:${visitId}`;

export function readInspection(visitId:string): InspectionState | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(inspectionKey(visitId));
  if (!value) return null;
  try { return JSON.parse(value) as InspectionState; } catch { return null; }
}

export function saveInspection(state:InspectionState) {
  window.localStorage.setItem(inspectionKey(state.visitId), JSON.stringify(state));
}

export function readVisitStatus(visitId:string, fallback:VisitStatus): VisitStatus {
  if (typeof window === "undefined") return fallback;
  return (window.localStorage.getItem(statusKey(visitId)) as VisitStatus | null) ?? fallback;
}

export function saveVisitStatus(visitId:string,status:VisitStatus) {
  window.localStorage.setItem(statusKey(visitId),status);
}
