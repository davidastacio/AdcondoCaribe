import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseServerFetch, type DatabaseUserRow } from "@/lib/database/verified-request";
import { serializeDatabaseUser, userSelect } from "@/lib/users/server";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  temporaryPassword: z.string().min(6).max(128),
  phone: z.string().trim().max(40).optional(),
  jobTitle: z.string().trim().max(100).optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "INCIDENT_SUPERVISOR"]),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED"]),
  notes: z.string().trim().max(1000).optional(),
});

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado." }, { status: 403 });
  const params = new URLSearchParams({ select: userSelect, order: "created_at.desc" });
  const response = await supabaseServerFetch(`users?${params}`);
  if (!response.ok) return Response.json({ error: "No se pudieron consultar los usuarios." }, { status: 502 });
  const users = (await response.json()) as DatabaseUserRow[];
  return Response.json({ users: users.map(serializeDatabaseUser) });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const input = createSchema.parse(await request.json());
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error("Firebase no está configurado.");

    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: input.email,
          password: input.temporaryPassword,
          returnSecureToken: false,
        }),
        cache: "no-store",
      },
    );
    const firebasePayload = (await firebaseResponse.json()) as {
      localId?: string;
      error?: { message?: string };
    };
    if (!firebaseResponse.ok || !firebasePayload.localId) {
      const duplicate = firebasePayload.error?.message?.includes("EMAIL_EXISTS");
      return Response.json(
        { error: duplicate ? "Ese correo ya existe en Firebase." : "Firebase no pudo crear el usuario." },
        { status: duplicate ? 409 : 502 },
      );
    }

    const databaseResponse = await supabaseServerFetch("users", {
      method: "POST",
      headers: { "content-type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        firebase_uid: firebasePayload.localId,
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone || null,
        job_title: input.jobTitle || null,
        role: input.role,
        status: input.status,
        notes: input.notes || null,
      }),
    });
    if (!databaseResponse.ok) {
      return Response.json({ error: "Firebase creó la identidad, pero el perfil interno falló." }, { status: 502 });
    }
    const [user] = (await databaseResponse.json()) as DatabaseUserRow[];
    return Response.json({ user: serializeDatabaseUser(user) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Revisa los datos del usuario." }, { status: 400 });
    return Response.json({ error: "No se pudo crear el usuario." }, { status: 500 });
  }
}
