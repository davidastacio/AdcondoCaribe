import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { z } from "zod";

export const runtime = "nodejs";

type AssignmentRow = { id: string; tower_id: string; supervisor_id: string; assigned_by_id: string; status: "ACTIVE" | "ENDED" | "SUSPENDED"; start_date: string; end_date: string | null; work_days: number[]; shift_start: string | null; shift_end: string | null; notes: string | null; created_at: string; updated_at: string };
type TowerRow = { id: string; name: string; code: string };
type UserRow = { id: string; first_name: string; last_name: string };

const createSchema = z.object({
  supervisorId: z.string().uuid(), towerIds: z.array(z.string().uuid()).min(1).max(50), startDate: z.string().date(), endDate: z.union([z.string().date(), z.literal("")]).optional(),
  workDays: z.array(z.number().int().min(0).max(6)).min(1).max(7), shiftStart: z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal("")]).optional(), shiftEnd: z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal("")]).optional(), notes: z.string().trim().max(1000).optional(),
}).refine((value) => Boolean(value.shiftStart) === Boolean(value.shiftEnd), { message: "Completa ambos campos del horario." });

const assignmentSelect = "id,tower_id,supervisor_id,assigned_by_id,status,start_date,end_date,work_days,shift_start,shift_end,notes,created_at,updated_at";

export async function GET(request: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado." }, { status: 403 });
  const supervisorId = new URL(request.url).searchParams.get("supervisorId");
  const filter = supervisorId ? `&supervisor_id=eq.${encodeURIComponent(supervisorId)}` : "";
  const [assignmentResponse, towerResponse, userResponse] = await Promise.all([
    supabaseServerFetch(`tower_assignments?select=${assignmentSelect}${filter}&order=created_at.desc`),
    supabaseServerFetch("towers?select=id,name,code&order=name.asc"),
    supabaseServerFetch("users?select=id,first_name,last_name"),
  ]);
  if (![assignmentResponse, towerResponse, userResponse].every((response) => response.ok)) return Response.json({ error: "No se pudieron consultar las asignaciones." }, { status: 502 });
  const rows = await assignmentResponse.json() as AssignmentRow[];
  const towers = new Map((await towerResponse.json() as TowerRow[]).map((tower) => [tower.id, tower]));
  const users = new Map((await userResponse.json() as UserRow[]).map((user) => [user.id, `${user.first_name} ${user.last_name}`]));
  return Response.json({ assignments: rows.map((row) => ({ id: row.id, towerId: row.tower_id, towerName: towers.get(row.tower_id)?.name, towerCode: towers.get(row.tower_id)?.code, supervisorId: row.supervisor_id, assignedById: row.assigned_by_id, assignedBy: users.get(row.assigned_by_id) ?? "Administrador", status: row.status, startDate: row.start_date, endDate: row.end_date ?? undefined, workDays: row.work_days, shiftStart: row.shift_start?.slice(0, 5), shiftEnd: row.shift_end?.slice(0, 5), notes: row.notes ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at })) });
}

export async function POST(request: Request) {
  const actor = await requireAdmin();
  if (!actor) return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const input = createSchema.parse(await request.json());
    const response = await supabaseServerFetch("tower_assignments", { method: "POST", headers: { "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(input.towerIds.map((towerId) => ({ tower_id: towerId, supervisor_id: input.supervisorId, assigned_by_id: actor.id, start_date: input.startDate, end_date: input.endDate || null, work_days: [...new Set(input.workDays)].sort(), shift_start: input.shiftStart || null, shift_end: input.shiftEnd || null, notes: input.notes || null }))) });
    if (!response.ok) {
      const duplicate = response.status === 409;
      return Response.json({ error: duplicate ? "Una de esas torres ya está asignada a este supervisor." : "No se pudieron guardar las asignaciones." }, { status: duplicate ? 409 : 502 });
    }
    return Response.json({ created: (await response.json() as AssignmentRow[]).length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message || "Revisa la asignación." }, { status: 400 });
    return Response.json({ error: "No se pudieron guardar las asignaciones." }, { status: 500 });
  }
}
