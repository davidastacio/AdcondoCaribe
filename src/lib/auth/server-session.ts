import { findVerifiedAppUser } from "@/lib/database/verified-request";
import { verifyFirebaseIdToken } from "@/lib/firebase/verify-token";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "adcondo_session";

export async function getServerSessionUser() {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!idToken) return null;

    const { uid } = await verifyFirebaseIdToken(idToken);
    const user = await findVerifiedAppUser(uid);
    return user?.status === "ACTIVE" ? user : null;
  } catch {
    return null;
  }
}
