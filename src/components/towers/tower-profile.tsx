"use client";
import type { Tower, TowerInput } from "@/features/towers/types";
import { ArrowLeft, CalendarPlus, Pencil, ShieldPlus } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { TowerStatusBadge } from "./tower-status-badge";
import { TowerSummary } from "./tower-summary";
import { TowerTabs } from "./tower-tabs";

export function TowerProfile({ id, role = "admin" }: { id: string; role?: "admin" | "supervisor" }) {
  const [tower, setTower] = useState<Tower>(), [error, setError] = useState(""), [confirm, setConfirm] = useState(false), [saving, setSaving] = useState(false);
  useEffect(() => { const endpoint = role === "admin" ? `/api/admin/towers/${id}` : `/api/supervisor/towers/${id}`; fetch(endpoint, { cache: "no-store" }).then(async (response) => { const data = await response.json() as { tower?: Tower; error?: string }; if (!response.ok || !data.tower) throw new Error(data.error); setTower(data.tower); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Torre no encontrada.")); }, [id, role]);
  async function deactivate() { if (!tower) return; setSaving(true); const input: TowerInput = { ...tower, status: "INACTIVE" }; const response = await fetch(`/api/admin/towers/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }); const data = await response.json() as { tower?: Tower; error?: string }; setSaving(false); if (!response.ok || !data.tower) { setError(data.error ?? "No se pudo desactivar la torre."); return; } setTower(data.tower); setConfirm(false); }
  if (error) return <section className="card"><p className="form-error">{error}</p></section>;
  if (!tower) return <div className="card">Cargando torre...</div>;
  return <><header className="tower-profile-header"><Link className="back-link" href={`/${role}/torres`}><ArrowLeft /> {role === "admin" ? "Torres" : "Mis torres"}</Link><div><span className="tower-building-icon">▥</span><div><small>{tower.code}</small><h1>{tower.name}</h1><p>{tower.address} · {tower.sector}</p></div><TowerStatusBadge status={tower.status} /></div>{role === "admin" && <nav><Link className="btn btn--soft" href={`/admin/torres/${id}/editar`}><Pencil /> Editar torre</Link><Link className="btn btn--soft" href="/admin/visitas/nueva"><CalendarPlus /> Programar visita</Link><Link className="btn btn--primary" href={`/supervisor/incidencias/nueva?towerId=${id}`}><ShieldPlus /> Nueva incidencia</Link>{tower.status !== "INACTIVE" && <button className="tower-deactivate" onClick={() => setConfirm(true)}>Desactivar</button>}</nav>}</header><TowerTabs role={role} /><Suspense fallback={<div className="card">Cargando resumen...</div>}><TowerSummary tower={tower} role={role} /></Suspense>{confirm && <div className="confirm-overlay"><section><h2>¿Seguro que deseas desactivar esta torre?</h2><p>La información histórica se conservará.</p><div><button className="btn btn--soft" onClick={() => setConfirm(false)}>Cancelar</button><button className="btn btn--danger" disabled={saving} onClick={deactivate}>{saving ? "Desactivando…" : "Desactivar torre"}</button></div></section></div>}</>;
}
