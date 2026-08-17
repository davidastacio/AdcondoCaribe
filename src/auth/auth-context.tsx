"use client";

import { permissionsForRole, type Permission } from "./permissions";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import type { AppRole, AppUser } from "@/features/users/types";
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthValue = {
  currentUser: AppUser | null;
  role: AppRole | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

async function openServerSession(idToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = (await response.json()) as { user?: AppUser; error?: string };
  if (!response.ok || !data.user) throw new Error(data.error ?? "Acceso no autorizado.");
  return data.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    return onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setCurrentUser(null);
          return;
        }
        setCurrentUser(await openServerSession(await firebaseUser.getIdToken()));
      } catch {
        setCurrentUser(null);
      } finally {
        setReady(true);
      }
    });
  }, []);

  const value = useMemo<AuthValue>(() => ({
    currentUser,
    role: currentUser?.role ?? null,
    permissions: currentUser ? permissionsForRole(currentUser.role) : [],
    isAuthenticated: currentUser?.status === "ACTIVE",
    isReady,
    async signIn(email, password) {
      const credential = await signInWithEmailAndPassword(getFirebaseClientAuth(), email, password);
      const user = await openServerSession(await credential.user.getIdToken());
      setCurrentUser(user);
      return user;
    },
    async signOut() {
      await Promise.allSettled([
        firebaseSignOut(getFirebaseClientAuth()),
        fetch("/api/auth/session", { method: "DELETE" }),
      ]);
      setCurrentUser(null);
    },
  }), [currentUser, isReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return value;
}

