import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { fetchRealVisits } from "@/lib/visits/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ visitId: string }> };

export async function GET(_: Request, { params }: Context) {
  const user = await getServerSessionUser();
  if (!user || user.role === "ADMIN") return Response.json({ error: "No autorizado." }, { status: 403 });
  const { visitId } = await params;
  const visit = (await fetchRealVisits(user.id)).find(item => item.id === visitId);
  return visit ? Response.json({ visit }) : Response.json({ error: "Visita no encontrada o no asignada." }, { status: 404 });
}

export async function POST(_: Request, { params }: Context) {
  const user = await getServerSessionUser();
  if (!user || user.role === "ADMIN") return Response.json({ error: "No autorizado." }, { status: 403 });
  const { visitId } = await params;
  const visitResponse = await supabaseServerFetch(`visits?select=id,tower_id,supervisor_id,checklist_template_id,status&id=eq.${encodeURIComponent(visitId)}`);
  const [visit] = visitResponse.ok ? await visitResponse.json() as { id: string; tower_id: string; supervisor_id: string; checklist_template_id: string|null; status: string }[] : [];
  if (!visit || visit.supervisor_id !== user.id) return Response.json({ error: "Visita no autorizada." }, { status: 403 });
  if (visit.status === "IN_PROGRESS") return Response.json({ success: true });
  if (!["SCHEDULED", "RESCHEDULED"].includes(visit.status)) return Response.json({ error: "La visita no puede iniciarse en su estado actual." }, { status: 400 });
  if (!visit.checklist_template_id) return Response.json({ error: "La visita no tiene un checklist asignado." }, { status: 400 });

  const [sectionsResponse, itemsResponse] = await Promise.all([
    supabaseServerFetch(`checklist_sections?select=id,name,description,required,sort_order&template_id=eq.${visit.checklist_template_id}&active=eq.true&order=sort_order.asc`),
    supabaseServerFetch("checklist_items?select=id,section_id,name,description,required,sort_order&active=eq.true&order=sort_order.asc"),
  ]);
  if (!sectionsResponse.ok || !itemsResponse.ok) return Response.json({ error: "No se pudo preparar el checklist." }, { status: 502 });
  const sections = await sectionsResponse.json() as { id: string; name: string; description: string|null; required: boolean; sort_order: number }[];
  const items = await itemsResponse.json() as { id: string; section_id: string; name: string; description: string|null; required: boolean; sort_order: number }[];
  const snapshot = { template_id: visit.checklist_template_id, sections: sections.map(section => ({ ...section, items: items.filter(item => item.section_id === section.id) })) };
  const now = new Date().toISOString();
  const inspectionResponse = await supabaseServerFetch("inspections", { method: "POST", headers: { "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ visit_id: visit.id, template_id: visit.checklist_template_id, template_version: 1, template_snapshot: snapshot, status: "IN_PROGRESS", started_at: now }) });
  if (!inspectionResponse.ok && inspectionResponse.status !== 409) return Response.json({ error: "No se pudo crear la inspección." }, { status: 502 });
  const update = await supabaseServerFetch(`visits?id=eq.${visit.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "IN_PROGRESS", started_at: now, started_by_id: user.id, updated_by_id: user.id }) });
  return update.ok ? Response.json({ success: true }) : Response.json({ error: "No se pudo iniciar la visita." }, { status: 502 });
}
