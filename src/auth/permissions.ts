import type { AppRole, AppUser } from "@/features/users/types";

export type Permission =
  | "admin.access"
  | "towers.read"
  | "towers.manage"
  | "users.manage"
  | "visits.read"
  | "visits.manage"
  | "incidents.read"
  | "incidents.manage"
  | "inventory.read"
  | "inventory.manage"
  | "checklists.manage"
  | "settings.manage";

const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  ADMIN: ["admin.access", "towers.read", "towers.manage", "users.manage", "visits.read", "visits.manage", "incidents.read", "incidents.manage", "inventory.read", "inventory.manage", "checklists.manage", "settings.manage"],
  SUPERVISOR: ["towers.read", "visits.read", "incidents.read", "inventory.read"],
};

export const permissionsForRole = (role: AppRole) => [...ROLE_PERMISSIONS[role]];
export const hasPermission = (role: AppRole, permission: Permission) => ROLE_PERMISSIONS[role].includes(permission);
export const canAccessRoute = (role: AppRole, pathname: string) => pathname.startsWith("/admin") ? role === "ADMIN" : pathname.startsWith("/supervisor") ? role === "ADMIN" || role === "SUPERVISOR" : true;
export const canManageUsers = (role: AppRole) => hasPermission(role, "users.manage");
export const canManageTowers = (role: AppRole) => hasPermission(role, "towers.manage");
export const canViewAssignedTower = (user: AppUser, towerId: string, assignedTowerIds: readonly string[]) => user.role === "ADMIN" || assignedTowerIds.includes(towerId);
export const homeForRole = (role: AppRole) => role === "ADMIN" ? "/admin" : "/supervisor";
