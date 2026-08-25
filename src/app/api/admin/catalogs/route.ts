import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { z } from "zod";

export const runtime = "nodejs";
const types = ["VISIT_TYPE", "INCIDENT_AREA", "INCIDENT_CATEGORY", "PRIORITY", "INVENTORY_CATEGORY", "UNIT", "DOCUMENT_CATEGORY"] as const;
const schema = z.object({ type: z.enum(types), code: z.string().trim().min(2).max(80).regex(/^[A-Z0-9_]+$/), label: z.string().trim().min(2).max(120) });
type Row = { id: string; catalog_type: typeof types[number]; code: string; label: string; active: boolean; sort_order: number };
const serialize = (row: Row) => ({ id: row.id, type: row.catalog_type, code: row.code, label: row.label, active: row.active, order: row.sort_order });

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado." }, { status: 403 });
  const response = await supabaseServerFetch(`catalog_items?select=id,catalog_type,code,label,active,sort_order&catalog_type=in.(${types.join(",")})&order=catalog_type.asc,sort_order.asc`);
  if (!response.ok) return Response.json({ error: "No se pudieron cargar los catálogos." }, { status: 502 });
  return Response.json({ items: (await response.json() as Row[]).map(serialize) });
}

export async function POST(request: Request) {
  const actor = await requireAdmin();
  if (!actor) return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const orderResponse = await supabaseServerFetch(`catalog_items?select=sort_order&catalog_type=eq.${input.type}&order=sort_order.desc&limit=1`);
    const [last] = orderResponse.ok ? await orderResponse.json() as { sort_order: number }[] : [];
    const response = await supabaseServerFetch("catalog_items", { method: "POST", headers: { "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ catalog_type: input.type, code: input.code, label: input.label, active: true, sort_order: (last?.sort_order ?? 0) + 10 }) });
    const [row] = response.ok ? await response.json() as Row[] : [];
    if (!row) return Response.json({ error: response.status === 409 ? "Ese código ya existe en el catálogo." : "No se pudo crear el valor." }, { status: response.status === 409 ? 409 : 502 });
    await supabaseServerFetch("activity_logs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ actor_user_id: actor.id, action: "CATALOG_CREATED", entity_type: "catalog_item", entity_id: row.id, metadata: { type: input.type, code: input.code } }) });
    return Response.json({ item: serialize(row) }, { status: 201 });
  } catch (error) { if (error instanceof z.ZodError) return Response.json({ error: "Revisa el nombre y el código." }, { status: 400 }); return Response.json({ error: "No se pudo crear el valor." }, { status: 500 }); }
}
