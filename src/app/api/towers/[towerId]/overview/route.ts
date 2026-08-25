import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { fetchRealDocuments } from "@/lib/documents/server";
import { fetchRealIncidents } from "@/lib/incidents/server";
import { fetchRealInventory } from "@/lib/inventory/server";
import { fetchRealMaterialRequests } from "@/lib/material-requests/server";
import { fetchRealActivity } from "@/lib/reports/server";
import { fetchRealTowers } from "@/lib/towers/server";
import { fetchRealVisits } from "@/lib/visits/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ towerId: string }> };

async function canViewTower(userId: string, role: string, towerId: string) {
  if (role === "ADMIN") return true;
  const query = new URLSearchParams({ select: "id", tower_id: `eq.${towerId}`, supervisor_id: `eq.${userId}`, status: "eq.ACTIVE", limit: "1" });
  const response = await supabaseServerFetch(`tower_assignments?${query}`);
  return response.ok && (await response.json() as { id: string }[]).length > 0;
}

export async function GET(_: Request, { params }: Context) {
  const user = await getServerSessionUser();
  if (!user) return Response.json({ error: "No autorizado." }, { status: 403 });
  const { towerId } = await params;
  if (!(await canViewTower(user.id, user.role, towerId))) return Response.json({ error: "Esta torre no está asignada a tu usuario." }, { status: 403 });
  try {
    const admin = user.role === "ADMIN";
    const [towers, visits, incidents, inventory, requests, documents, activity] = await Promise.all([
      fetchRealTowers(), fetchRealVisits(admin ? undefined : user.id), fetchRealIncidents(admin ? undefined : user.id),
      fetchRealInventory([towerId]), fetchRealMaterialRequests(admin ? undefined : user.id), fetchRealDocuments([towerId]), fetchRealActivity(),
    ]);
    const tower = towers.find((item) => item.id === towerId);
    if (!tower || (!admin && tower.status === "INACTIVE")) return Response.json({ error: "Torre no encontrada." }, { status: 404 });
    return Response.json({ visits: visits.filter((item) => item.towerId === towerId), incidents: incidents.filter((item) => item.towerId === towerId), inventory, requests: requests.filter((item) => item.towerId === towerId), documents, activity: activity.filter((item) => item.towerId === towerId) });
  } catch (error) {
    console.error("[tower/overview] No se pudo cargar el resumen.", error);
    return Response.json({ error: "No se pudo cargar la actividad real de la torre." }, { status: 502 });
  }
}
