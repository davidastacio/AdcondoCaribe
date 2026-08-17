import { findVerifiedAppUser } from "@/lib/database/verified-request";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { z } from "zod";

export const runtime = "nodejs";

const COOKIE_NAME = "adcondo_session";
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

async function verifyToken(idToken: string) {
  return getFirebaseAdminAuth().verifyIdToken(idToken, false);
}

export async function POST(request: Request) {
  try {
    const { idToken } = bodySchema.parse(await request.json());
    const decoded = await verifyToken(idToken);
    const user = await findVerifiedAppUser(decoded.uid);
    if (!user || user.status !== "ACTIVE") {
      return Response.json({ error: "Usuario no autorizado en ADCONDO." }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 55 * 60,
    });
    return Response.json({ user: serializeUser(user) });
  } catch {
    return Response.json({ error: "No se pudo validar la sesión." }, { status: 401 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get(COOKIE_NAME)?.value;
    if (!idToken) return Response.json({ user: null }, { status: 401 });

    const decoded = await verifyToken(idToken);
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
  cookieStore.delete(COOKIE_NAME);
  return Response.json({ ok: true });
}

