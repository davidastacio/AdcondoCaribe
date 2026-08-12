"use client";
import { ShieldX } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/auth/auth-context";
import { homeForRole } from "@/auth/permissions";

export function AccessDenied({ unauthenticated = false }: { unauthenticated?: boolean }) {
  const { role } = useAuth();
  return <main className="access-denied"><section className="card"><ShieldX size={38}/><h1>{unauthenticated ? "Inicia sesión" : "Acceso no autorizado"}</h1><p>{unauthenticated ? "Debes iniciar sesión para acceder a esta sección." : "No tienes permisos para acceder a esta sección."}</p><Link className="btn btn--primary" href={unauthenticated || !role ? "/login" : homeForRole(role)}>{unauthenticated ? "Ir al inicio de sesión" : "Volver al inicio"}</Link></section></main>;
}
