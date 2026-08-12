"use client";
import { useAuth } from "@/auth/auth-context";
import type { AppRole } from "@/features/users/types";
import { AccessDenied } from "./access-denied";

export function RoleGuard({ allow, children }: { allow: AppRole[]; children: React.ReactNode }) {
  const { isAuthenticated, isReady, role } = useAuth();
  if (!isReady) return <main className="access-denied"><section className="card"><p>Validando acceso…</p></section></main>;
  if (!isAuthenticated || !role) return <AccessDenied unauthenticated/>;
  if (!allow.includes(role)) return <AccessDenied/>;
  return children;
}

export const AdminRoute = ({ children }: { children: React.ReactNode }) => <RoleGuard allow={["ADMIN"]}>{children}</RoleGuard>;
export const SupervisorRoute = ({ children }: { children: React.ReactNode }) => <RoleGuard allow={["ADMIN", "SUPERVISOR"]}>{children}</RoleGuard>;
