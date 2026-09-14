import { supabaseServerFetch } from "@/lib/database/verified-request";

type AssignmentRow = { id:string;tower_id:string;supervisor_id:string;assigned_by_id:string;start_date:string;end_date:string|null;work_days:number[];shift_start:string|null };
type ExistingVisitRow = { tower_id: string };
type TemplateRow = { id: string };

export function operationalDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function dayOfWeek(date: string) { return new Date(`${date}T12:00:00-04:00`).getUTCDay(); }
function scheduledTime(assignment: AssignmentRow, index: number) {
  if (assignment.shift_start) return assignment.shift_start.slice(0, 5);
  const minutes = 8 * 60 + index * 60;
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export async function ensureDailyVisits(supervisorId: string, date = operationalDate()) {
  const [assignmentResponse, existingResponse, templateResponse] = await Promise.all([
    supabaseServerFetch(`tower_assignments?select=id,tower_id,supervisor_id,assigned_by_id,start_date,end_date,work_days,shift_start&supervisor_id=eq.${encodeURIComponent(supervisorId)}&status=eq.ACTIVE&start_date=lte.${date}`),
    supabaseServerFetch(`visits?select=tower_id&supervisor_id=eq.${encodeURIComponent(supervisorId)}&scheduled_date=eq.${date}&status=not.eq.CANCELLED`),
    supabaseServerFetch("checklist_templates?select=id&active=eq.true&order=version.desc,created_at.asc&limit=1"),
  ]);
  if (!assignmentResponse.ok || !existingResponse.ok || !templateResponse.ok) throw new Error("No se pudo preparar la agenda diaria.");
  const assignments = (await assignmentResponse.json() as AssignmentRow[]).filter(item => (!item.end_date || item.end_date >= date) && item.work_days.includes(dayOfWeek(date)));
  const existingTowerIds = new Set((await existingResponse.json() as ExistingVisitRow[]).map(item => item.tower_id));
  const [template] = await templateResponse.json() as TemplateRow[];
  if (!template || assignments.length === 0) return { created: 0 };
  let created = 0;
  for (const [index, assignment] of assignments.entries()) {
    if (existingTowerIds.has(assignment.tower_id)) continue;
    const response = await supabaseServerFetch("visits", { method: "POST", headers: { "content-type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({
      code: `AUTO-${date.replaceAll("-", "")}-${assignment.id.slice(0, 8).toUpperCase()}`,
      tower_id: assignment.tower_id, supervisor_id: assignment.supervisor_id, checklist_template_id: template.id,
      status: "SCHEDULED", scheduled_date: date, scheduled_time: scheduledTime(assignment, index), estimated_duration_minutes: 60,
      priority: "MEDIUM", notes: "Visita diaria generada automáticamente desde la asignación de torre.",
      created_by_id: assignment.assigned_by_id, updated_by_id: assignment.assigned_by_id,
    }) });
    if (response.ok) { created += 1; existingTowerIds.add(assignment.tower_id); }
    else if (response.status !== 409) throw new Error("No se pudo generar una visita diaria.");
  }
  return { created };
}
