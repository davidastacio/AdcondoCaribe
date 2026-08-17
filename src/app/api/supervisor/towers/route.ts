import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { fetchRealTowers } from "@/lib/towers/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user || user.role === "ADMIN") return Response.json({ error: "No autorizado." }, { status: 403 });
  const response = await supabaseServerFetch(`tower_assignments?select=tower_id&supervisor_id=eq.${encodeURIComponent(user.id)}&status=eq.ACTIVE&start_date=lte.${new Date().toISOString().slice(0, 10)}`);
  if (!response.ok) return Response.json({ error: "No se pudieron consultar tus asignaciones." }, { status: 502 });
  const ids = new Set((await response.json() as { tower_id: string }[]).map((item) => item.tower_id));
  try { return Response.json({ towers: (await fetchRealTowers()).filter((tower) => ids.has(tower.id) && tower.status !== "INACTIVE") }); }
  catch { return Response.json({ error: "No se pudieron consultar tus torres." }, { status: 502 }); }
}
