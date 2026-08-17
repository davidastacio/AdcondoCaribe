import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { fetchRealTowers } from "@/lib/towers/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ towerId: string }> };

export async function GET(_: Request, { params }: Context) {
  const user = await getServerSessionUser();
  if (!user || user.role === "ADMIN") return Response.json({ error: "No autorizado." }, { status: 403 });
  const { towerId } = await params;
  const query = new URLSearchParams({ select: "id", tower_id: `eq.${towerId}`, supervisor_id: `eq.${user.id}`, status: "eq.ACTIVE", limit: "1" });
  const assignmentResponse = await supabaseServerFetch(`tower_assignments?${query}`);
  const assigned = assignmentResponse.ok ? await assignmentResponse.json() as { id: string }[] : [];
  if (!assigned.length) return Response.json({ error: "Esta torre no está asignada a tu usuario." }, { status: 403 });
  const tower = (await fetchRealTowers()).find((item) => item.id === towerId && item.status !== "INACTIVE");
  return tower ? Response.json({ tower }) : Response.json({ error: "Torre no encontrada." }, { status: 404 });
}
