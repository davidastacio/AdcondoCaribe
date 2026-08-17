import { DashboardShell } from "@/components/dashboard-shell";
import { SupervisorRoute } from "@/components/auth/role-guard";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/supervisor");
  if (user.role !== "SUPERVISOR") redirect("/admin");
  return <SupervisorRoute><DashboardShell role="supervisor">{children}</DashboardShell></SupervisorRoute>;
}
