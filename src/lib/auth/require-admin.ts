import { getServerSessionUser } from "./server-session";

export async function requireAdmin() {
  const user = await getServerSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
