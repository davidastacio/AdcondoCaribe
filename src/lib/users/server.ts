import type { AppUser } from "@/features/users/types";
import type { DatabaseUserRow } from "@/lib/database/verified-request";

export function serializeDatabaseUser(user: DatabaseUserRow): AppUser {
  return {
    id: user.id,
    firebaseUid: user.firebase_uid,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone ?? undefined,
    avatarUrl: undefined,
    jobTitle: user.job_title ?? undefined,
    notes: user.notes ?? undefined,
    role: user.role,
    status: user.status,
    lastLoginAt: user.last_login_at ?? undefined,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export const userSelect =
  "id,firebase_uid,email,first_name,last_name,phone,avatar_storage_key,job_title,notes,role,status,last_login_at,created_at,updated_at";
