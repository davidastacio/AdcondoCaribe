import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { z } from "zod";

export const runtime = "nodejs";
type Context = { params: Promise<{ catalogId: string }> };
const schema = z.object({ label: z.string().trim().min(2).max(120).optional(), active: z.boolean().optional() }).refine((value) => value.label !== undefined || value.active !== undefined);

export async function PATCH(request: Request, { params }: Context) {
  const actor = await requireAdmin();
  if (!actor) return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const { catalogId } = await params, input = schema.parse(await request.json()), body: Record<string, unknown> = {};
    if (input.label !== undefined) body.label = input.label;
    if (input.active !== undefined) body.active = input.active;
    const response = await supabaseServerFetch(`catalog_items?id=eq.${encodeURIComponent(catalogId)}`, { method: "PATCH", headers: { "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(body) });
    const [row] = response.ok ? await response.json() as { id: string }[] : [];
    if (!row) return Response.json({ error: "No se pudo actualizar el valor." }, { status: 502 });
    await supabaseServerFetch("activity_logs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ actor_user_id: actor.id, action: "CATALOG_UPDATED", entity_type: "catalog_item", entity_id: catalogId, metadata: body }) });
    return Response.json({ ok: true });
  } catch (error) { if (error instanceof z.ZodError) return Response.json({ error: "El cambio no es válido." }, { status: 400 }); return Response.json({ error: "No se pudo actualizar el valor." }, { status: 500 }); }
}
