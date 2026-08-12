import { DashboardShell } from "@/components/dashboard-shell";
import { SupervisorRoute } from "@/components/auth/role-guard";
export default function SupervisorLayout({children}:{children:React.ReactNode}){return <SupervisorRoute><DashboardShell role="supervisor">{children}</DashboardShell></SupervisorRoute>}
