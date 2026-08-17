import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { towerInputSchema, towerPayload } from "@/lib/towers/input";
import { fetchRealTowers, towerSelect, type DatabaseTowerRow } from "@/lib/towers/server";
import { z } from "zod";

export const runtime = "nodejs";
type Context = { params: Promise<{ towerId: string }> };

export async function GET(_: Request, { params }: Context) {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado." }, { status: 403 });
  const { towerId } = await params;
  try {
    const tower = (await fetchRealTowers()).find((item) => item.id === towerId);
    return tower ? Response.json({ tower }) : Response.json({ error: "Torre no encontrada." }, { status: 404 });
  } catch { return Response.json({ error: "No se pudo consultar la torre." }, { status: 502 }); }
}

export async function PATCH(request: Request, { params }: Context) {
  const actor = await requireAdmin();
  if (!actor) return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const { towerId } = await params;
    const input = towerInputSchema.parse(await request.json());
    const currentQuery = new URLSearchParams({ select: "code", id: `eq.${towerId}`, limit: "1" });
    const currentResponse = await supabaseServerFetch(`towers?${currentQuery}`);
    const [current] = currentResponse.ok ? await currentResponse.json() as { code: string }[] : [];
    if (!current) return Response.json({ error: "Torre no encontrada." }, { status: 404 });
    const response = await supabaseServerFetch(`towers?id=eq.${encodeURIComponent(towerId)}&select=${towerSelect}`, { method: "PATCH", headers: { "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ ...towerPayload(input, actor, current.code), created_by_id: undefined }) });
    const [row] = response.ok ? await response.json() as DatabaseTowerRow[] : [];
    if (!row) return Response.json({ error: "No se pudo actualizar la torre." }, { status: 502 });

    const existingResponse = await supabaseServerFetch(`tower_contacts?select=id&tower_id=eq.${encodeURIComponent(towerId)}`);
    const existing = existingResponse.ok ? await existingResponse.json() as { id: string }[] : [];
    const retainedIds = input.contacts.map((contact) => contact.id).filter((id): id is string => Boolean(id));
    await Promise.all(existing.filter((contact) => !retainedIds.includes(contact.id)).map((contact) => supabaseServerFetch(`tower_contacts?id=eq.${contact.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: false }) })));
    await Promise.all(input.contacts.map((contact) => contact.id
      ? supabaseServerFetch(`tower_contacts?id=eq.${contact.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: contact.type, name: contact.name, phone: contact.phone || null, email: contact.email || null, notes: contact.notes || null, active: true }) })
      : supabaseServerFetch("tower_contacts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tower_id: towerId, type: contact.type, name: contact.name, phone: contact.phone || null, email: contact.email || null, notes: contact.notes || null }) })));
    const tower = (await fetchRealTowers()).find((item) => item.id === towerId);
    return Response.json({ tower });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Revisa los datos de la torre." }, { status: 400 });
    return Response.json({ error: "No se pudo actualizar la torre." }, { status: 500 });
  }
}
