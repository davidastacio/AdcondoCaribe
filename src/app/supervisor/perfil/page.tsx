"use client";
import { UserForm, type UserFormValue } from "@/components/users/user-form";
import type { AppUser } from "@/features/users/types";
import { Building2, CalendarCheck, ShieldAlert, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ProfileData = { user: AppUser; towers: { id: string; name: string }[]; completedVisits: number; reportedIncidents: number };

export default function Profile() {
  const [data, setData] = useState<ProfileData>(), [error, setError] = useState(""), [message, setMessage] = useState("");
  const load = useCallback(async () => { const response = await fetch("/api/profile", { cache: "no-store" }); const result = await response.json() as ProfileData & { error?: string }; if (!response.ok || !result.user) throw new Error(result.error ?? "No se pudo cargar el perfil."); setData(result); }, []);
  useEffect(() => { load().catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudo cargar el perfil.")); }, [load]);
  async function save(value: UserFormValue) { setMessage(""); const response = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ firstName: value.firstName, lastName: value.lastName, phone: value.phone, jobTitle: value.jobTitle }) }); const result = await response.json() as { user?: AppUser; error?: string }; if (!response.ok || !result.user) throw new Error(result.error ?? "No se pudo guardar el perfil."); setData((current) => current ? { ...current, user: result.user! } : current); setMessage("Perfil actualizado correctamente."); }
  if (error) return <section className="card"><p className="form-error">{error}</p></section>;
  if (!data) return <section className="card">Cargando perfil...</section>;
  return <><header className="module-heading"><div><span className="eyebrow"><UserRound /> Mi cuenta</span><h1>Mi perfil</h1><p>Actualiza tus datos básicos de contacto.</p></div></header><div className="profile-kpis"><article><Building2 /><b>{data.towers.length}</b><span>Torres asignadas</span></article><article><CalendarCheck /><b>{data.completedVisits}</b><span>Visitas completadas</span></article><article><ShieldAlert /><b>{data.reportedIncidents}</b><span>Incidencias reportadas</span></article></div><section className="card assigned-tower-chips"><h2>Mis torres asignadas</h2>{data.towers.length ? data.towers.map((tower) => <span key={tower.id}>{tower.name}</span>) : <p>No tienes torres asignadas actualmente.</p>}</section>{message && <p className="form-success" role="status">{message}</p>}<UserForm key={data.user.updatedAt} user={data.user} profile onSubmit={save} /></>;
}
