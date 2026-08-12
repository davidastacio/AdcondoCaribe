"use client";

import { permissionsForRole, type Permission } from "./permissions";
import { getUser } from "@/features/users/service";
import type { AppRole, AppUser } from "@/features/users/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const SESSION_KEY = "adcondo:mock-session:v2";
type StoredSession = { userId: string; role: AppRole };
type AuthValue = { currentUser: AppUser | null; role: AppRole | null; permissions: Permission[]; isAuthenticated: boolean; isReady: boolean; signInMock: (role: AppRole) => void; signOut: () => void };
const AuthContext = createContext<AuthValue | null>(null);

function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as StoredSession | null; } catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isReady, setReady] = useState(false);
  useEffect(() => { setSession(readSession()); setReady(true); }, []);
  const currentUser = session ? getUser(session.userId) : null;
  const value = useMemo<AuthValue>(() => ({
    currentUser,
    role: session?.role ?? null,
    permissions: session ? permissionsForRole(session.role) : [],
    isAuthenticated: Boolean(session && currentUser?.status === "ACTIVE"),
    isReady,
    signInMock(role) {
      const next = { role, userId: role === "ADMIN" ? "usr-admin" : "usr-juan" };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      localStorage.setItem("adcondo:current-role:v1", role);
      setSession(next);
    },
    signOut() { localStorage.removeItem(SESSION_KEY); setSession(null); },
  }), [currentUser, isReady, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return value;
}
