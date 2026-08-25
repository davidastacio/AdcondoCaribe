import { findVerifiedAppUser } from "@/lib/database/verified-request";
import { SESSION_COOKIE_NAME } from "@/lib/auth/server-session";
import { verifyFirebaseIdToken } from "@/lib/firebase/verify-token";
import { cookies } from "next/headers";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({ idToken: z.string().min(100) });

function serializeUser(user: Awaited<ReturnType<typeof findVerifiedAppUser>>) {
  if (!user) return null;
  return {
    id: user.id,
    firebaseUid: user.firebase_uid,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone ?? undefined,
    avatarUrl: undefined,
    jobTitle: user.job_title ?? undefined,
    role: user.role,
    status: user.status,
    lastLoginAt: user.last_login_at ?? undefined,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export async function POST(request: Request) {
  let decoded: Awaited<ReturnType<typeof verifyFirebaseIdToken>>;
  let idToken: string;
  try {
    ({ idToken } = bodySchema.parse(await request.json()));
    decoded = await verifyFirebaseIdToken(idToken);
  } catch {
    return Response.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  try {
    const user = await findVerifiedAppUser(decoded.uid);
    if (!user || user.status !== "ACTIVE") {
      return Response.json({ error: "Usuario no autorizado en ADCONDO." }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 55 * 60,
    });
    return Response.json({ user: serializeUser(user) });
  } catch (error) {
    console.error("[auth/session] No se pudo consultar la identidad en Supabase.", error);
    return Response.json(
      { error: "El servicio de datos está iniciando. Intenta nuevamente en unos minutos." },
      { status: 503 },
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!idToken) return Response.json({ user: null }, { status: 401 });

    const decoded = await verifyFirebaseIdToken(idToken);
    const user = await findVerifiedAppUser(decoded.uid);
    if (!user || user.status !== "ACTIVE") {
      return Response.json({ user: null }, { status: 403 });
    }
    return Response.json({ user: serializeUser(user) });
  } catch {
    return Response.json({ user: null }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return Response.json({ ok: true });
}
