import { DashboardShell } from "@/components/dashboard-shell";
import { AdminRoute } from "@/components/auth/role-guard";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/supervisor");
  return <AdminRoute><DashboardShell role="admin">{children}</DashboardShell></AdminRoute>;
}
