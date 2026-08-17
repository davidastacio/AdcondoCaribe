import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseServerFetch, type DatabaseUserRow } from "@/lib/database/verified-request";
import { serializeDatabaseUser, userSelect } from "@/lib/users/server";
import { z } from "zod";

export const runtime = "nodejs";

const updateSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(40).optional(),
  jobTitle: z.string().trim().max(100).optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "INCIDENT_SUPERVISOR"]),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED"]),
  notes: z.string().trim().max(1000).optional(),
});

type Context = { params: Promise<{ userId: string }> };

export async function GET(_: Request, { params }: Context) {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado." }, { status: 403 });
  const { userId } = await params;
  const query = new URLSearchParams({ select: userSelect, id: `eq.${userId}`, limit: "1" });
  const response = await supabaseServerFetch(`users?${query}`);
  const [user] = response.ok ? ((await response.json()) as DatabaseUserRow[]) : [];
  if (!user) return Response.json({ error: "Usuario no encontrado." }, { status: 404 });
  return Response.json({ user: serializeDatabaseUser(user) });
}

export async function PATCH(request: Request, { params }: Context) {
  const actor = await requireAdmin();
  if (!actor) return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const { userId } = await params;
    const input = updateSchema.parse(await request.json());
    if (actor.id === userId && (input.role !== "ADMIN" || input.status !== "ACTIVE")) {
      return Response.json({ error: "No puedes retirar tu propio acceso administrativo." }, { status: 400 });
    }
    const response = await supabaseServerFetch(`users?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone || null,
        job_title: input.jobTitle || null,
        role: input.role,
        status: input.status,
        notes: input.notes || null,
      }),
    });
    const [user] = response.ok ? ((await response.json()) as DatabaseUserRow[]) : [];
    if (!user) return Response.json({ error: "No se pudo actualizar el usuario." }, { status: 502 });
    return Response.json({ user: serializeDatabaseUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Revisa los datos del usuario." }, { status: 400 });
    return Response.json({ error: "No se pudo actualizar el usuario." }, { status: 500 });
  }
}
