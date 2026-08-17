import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseServerFetch } from "@/lib/database/verified-request";

export const runtime = "nodejs";
type Context = { params: Promise<{ assignmentId: string }> };

export async function PATCH(_: Request, { params }: Context) {
  const actor = await requireAdmin();
  if (!actor) return Response.json({ error: "No autorizado." }, { status: 403 });
  const { assignmentId } = await params;
  const response = await supabaseServerFetch(`tower_assignments?id=eq.${encodeURIComponent(assignmentId)}&status=eq.ACTIVE`, { method: "PATCH", headers: { "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ status: "ENDED", end_date: new Date().toISOString().slice(0, 10), ended_by_id: actor.id }) });
  const rows = response.ok ? await response.json() as unknown[] : [];
  return rows.length ? Response.json({ success: true }) : Response.json({ error: "No se pudo retirar la asignación." }, { status: 400 });
}
