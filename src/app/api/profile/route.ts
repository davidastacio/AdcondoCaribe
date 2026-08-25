import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch, type DatabaseUserRow } from "@/lib/database/verified-request";
import { fetchRealIncidents } from "@/lib/incidents/server";
import { fetchRealTowers } from "@/lib/towers/server";
import { serializeDatabaseUser } from "@/lib/users/server";
import { fetchRealVisits } from "@/lib/visits/server";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({ firstName: z.string().trim().min(2).max(80), lastName: z.string().trim().min(2).max(80), phone: z.string().trim().max(40).optional(), jobTitle: z.string().trim().max(100).optional() });

async function profileOverview(user: DatabaseUserRow) {
  const [assignmentResponse, towers, visits, incidents] = await Promise.all([
    supabaseServerFetch(`tower_assignments?select=id,tower_id&supervisor_id=eq.${user.id}&status=eq.ACTIVE`),
    fetchRealTowers(), fetchRealVisits(user.id), fetchRealIncidents(user.id),
  ]);
  if (!assignmentResponse.ok) throw new Error("No se pudieron consultar las asignaciones.");
  const assignments = await assignmentResponse.json() as { id: string; tower_id: string }[];
  const names = new Map(towers.map((tower) => [tower.id, tower.name]));
  return { user: serializeDatabaseUser(user), towers: assignments.map((assignment) => ({ id: assignment.tower_id, name: names.get(assignment.tower_id) ?? "Torre" })), completedVisits: visits.filter((visit) => visit.status === "COMPLETED").length, reportedIncidents: incidents.filter((incident) => incident.reportedById === user.id).length };
}

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) return Response.json({ error: "No autorizado." }, { status: 403 });
  try { return Response.json(await profileOverview(user)); } catch { return Response.json({ error: "No se pudo cargar el perfil." }, { status: 502 }); }
}

export async function PATCH(request: Request) {
  const user = await getServerSessionUser();
  if (!user) return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const response = await supabaseServerFetch(`users?id=eq.${user.id}`, { method: "PATCH", headers: { "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ first_name: input.firstName, last_name: input.lastName, phone: input.phone || null, job_title: input.jobTitle || null }) });
    const [updated] = response.ok ? await response.json() as DatabaseUserRow[] : [];
    if (!updated) return Response.json({ error: "No se pudo actualizar el perfil." }, { status: 502 });
    await supabaseServerFetch("activity_logs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ actor_user_id: user.id, action: "USER_UPDATED", entity_type: "user", entity_id: user.id, metadata: { source: "self_profile" } }) });
    return Response.json({ user: serializeDatabaseUser(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Revisa los datos del perfil." }, { status: 400 });
    return Response.json({ error: "No se pudo actualizar el perfil." }, { status: 500 });
  }
}
