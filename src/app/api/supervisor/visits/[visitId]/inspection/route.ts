import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { z } from "zod";

export const runtime = "nodejs";
type Context = { params: Promise<{ visitId: string }> };
const answerSchema = z.object({ action: z.literal("ANSWER"), itemId: z.string().uuid(), condition: z.enum(["OPTIMAL","REGULAR","BAD","NOT_APPLICABLE"]), observation: z.string().trim().max(2000).optional(), responsible: z.string().trim().max(300).optional(), materialNeeded: z.string().trim().max(1000).optional(), priority: z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).optional() });
const inputSchema = z.discriminatedUnion("action", [answerSchema, z.object({ action: z.literal("FINISH") })]);
type Snapshot = { sections: { id: string; name: string; items: { id: string; name: string; description?: string; required: boolean }[] }[] };

async function inspectionContext(visitId: string, userId: string) {
  const visitResponse = await supabaseServerFetch(`visits?select=id,tower_id,supervisor_id,status&id=eq.${visitId}&limit=1`);
  const [visit] = visitResponse.ok ? await visitResponse.json() as { id: string; tower_id: string; supervisor_id: string; status: string }[] : [];
  if (!visit || visit.supervisor_id !== userId) return null;
  const inspectionResponse = await supabaseServerFetch(`inspections?select=id,visit_id,template_id,template_snapshot,status,progress,started_at,completed_at&visit_id=eq.${visitId}&limit=1`);
  const [inspection] = inspectionResponse.ok ? await inspectionResponse.json() as { id: string; template_id: string; template_snapshot: Snapshot; status: string; progress: number; started_at: string; completed_at: string|null }[] : [];
  return inspection ? { visit, inspection } : null;
}

export async function GET(_: Request, { params }: Context) {
  const user = await getServerSessionUser();
  if (!user || user.role === "ADMIN") return Response.json({ error: "No autorizado." }, { status: 403 });
  const { visitId } = await params;
  const context = await inspectionContext(visitId, user.id);
  if (!context) return Response.json({ error: "Inspección no encontrada." }, { status: 404 });
  const answerResponse = await supabaseServerFetch(`inspection_answers?select=item_id,condition,observation,responsible,material_needed,priority,updated_at&inspection_id=eq.${context.inspection.id}`);
  const rows = answerResponse.ok ? await answerResponse.json() as { item_id: string; condition: string; observation: string|null; responsible: string|null; material_needed: string|null; priority: string|null; updated_at: string }[] : [];
  return Response.json({ inspection: { id: context.inspection.id, startedAt: context.inspection.started_at, status: context.inspection.status, progress: context.inspection.progress, sections: context.inspection.template_snapshot.sections.map(section => ({ id: section.id, title: section.name, items: section.items.map(item => ({ id: item.id, title: item.name, instructions: item.description ?? "", required: item.required })) })), answers: Object.fromEntries(rows.map(row => [row.item_id, { condition: row.condition, observation: row.observation ?? undefined, responsible: row.responsible ?? undefined, materialNeeded: row.material_needed ?? undefined, priority: row.priority ?? undefined, updatedAt: row.updated_at }])) } });
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getServerSessionUser();
  if (!user || user.role === "ADMIN") return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const { visitId } = await params;
    const input = inputSchema.parse(await request.json());
    const context = await inspectionContext(visitId, user.id);
    if (!context || context.visit.status !== "IN_PROGRESS" || context.inspection.status !== "IN_PROGRESS") return Response.json({ error: "La inspección no está en progreso." }, { status: 400 });
    if (input.action === "ANSWER") {
      const valid = context.inspection.template_snapshot.sections.some(section => section.items.some(item => item.id === input.itemId));
      if (!valid) return Response.json({ error: "Punto de checklist inválido." }, { status: 400 });
      const response = await supabaseServerFetch("inspection_answers?on_conflict=inspection_id,item_id", { method: "POST", headers: { "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ inspection_id: context.inspection.id, item_id: input.itemId, condition: input.condition, observation: input.observation || null, responsible: input.responsible || null, material_needed: input.materialNeeded || null, priority: input.priority || null }) });
      if (!response.ok) return Response.json({ error: "No se pudo guardar la respuesta." }, { status: 502 });
      const countResponse = await supabaseServerFetch(`inspection_answers?select=id&inspection_id=eq.${context.inspection.id}`);
      const count = countResponse.ok ? (await countResponse.json() as unknown[]).length : 0;
      const total = context.inspection.template_snapshot.sections.reduce((sum, section) => sum + section.items.length, 0);
      const progress = Math.round(count / Math.max(total, 1) * 100);
      await supabaseServerFetch(`inspections?id=eq.${context.inspection.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ progress }) });
      return Response.json({ success: true, progress });
    }

    const required = context.inspection.template_snapshot.sections.flatMap(section => section.items).filter(item => item.required);
    const answersResponse = await supabaseServerFetch(`inspection_answers?select=item_id,condition,observation&inspection_id=eq.${context.inspection.id}`);
    const answers = answersResponse.ok ? await answersResponse.json() as { item_id: string; condition: string; observation: string|null }[] : [];
    if (required.some(item => !answers.some(answer => answer.item_id === item.id))) return Response.json({ error: "Faltan puntos obligatorios por responder." }, { status: 400 });
    if (answers.some(answer => ["REGULAR", "BAD"].includes(answer.condition) && !answer.observation?.trim())) return Response.json({ error: "Describe los problemas marcados como Regular o Mal." }, { status: 400 });
    const condition = answers.some(answer => answer.condition === "BAD") ? "BAD" : answers.some(answer => answer.condition === "REGULAR") ? "REGULAR" : "OPTIMAL";
    const now = new Date().toISOString();
    const inspectionUpdate = await supabaseServerFetch(`inspections?id=eq.${context.inspection.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "COMPLETED", progress: 100, completed_at: now, overall_condition: condition }) });
    const visitUpdate = await supabaseServerFetch(`visits?id=eq.${visitId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "COMPLETED", completed_at: now, completed_by_id: user.id, updated_by_id: user.id }) });
    return inspectionUpdate.ok && visitUpdate.ok ? Response.json({ success: true }) : Response.json({ error: "No se pudo finalizar la visita." }, { status: 502 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message ?? "Revisa la respuesta." }, { status: 400 });
    return Response.json({ error: "No se pudo actualizar la inspección." }, { status: 500 });
  }
}
