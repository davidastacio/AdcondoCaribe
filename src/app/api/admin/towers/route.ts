import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { towerInputSchema, towerPayload } from "@/lib/towers/input";
import { fetchRealTowers, serializeTower, towerSelect, type DatabaseTowerRow } from "@/lib/towers/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado." }, { status: 403 });
  try { return Response.json({ towers: await fetchRealTowers() }); }
  catch { return Response.json({ error: "No se pudieron consultar las torres." }, { status: 502 }); }
}

export async function POST(request: Request) {
  const actor = await requireAdmin();
  if (!actor) return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const input = towerInputSchema.parse(await request.json());
    const code = input.code || `TOR-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    const response = await supabaseServerFetch(`towers?select=${towerSelect}`, { method: "POST", headers: { "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(towerPayload(input, actor, code)) });
    const [row] = response.ok ? (await response.json()) as DatabaseTowerRow[] : [];
    if (!row) return Response.json({ error: response.status === 409 ? "Ese código ya está registrado." : "No se pudo crear la torre." }, { status: response.status === 409 ? 409 : 502 });
    if (input.contacts.length) await supabaseServerFetch("tower_contacts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input.contacts.map((contact) => ({ tower_id: row.id, type: contact.type, name: contact.name, phone: contact.phone || null, email: contact.email || null, notes: contact.notes || null }))) });
    const itemsResponse=await supabaseServerFetch("inventory_items?select=id&active=eq.true");
    if(itemsResponse.ok){const items=await itemsResponse.json() as {id:string}[];if(items.length)await supabaseServerFetch("tower_inventory",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(items.map(item=>({tower_id:row.id,inventory_item_id:item.id,quantity:0,stock_status:"NOT_VERIFIED"})))});}
    return Response.json({ tower: serializeTower(row, [], []) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Revisa los datos de la torre." }, { status: 400 });
    return Response.json({ error: "No se pudo crear la torre." }, { status: 500 });
  }
}
