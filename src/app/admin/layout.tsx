import { DashboardShell } from "@/components/dashboard-shell";
import { AdminRoute } from "@/components/auth/role-guard";
export default function AdminLayout({children}:{children:React.ReactNode}){return <AdminRoute><DashboardShell role="admin">{children}</DashboardShell></AdminRoute>}
