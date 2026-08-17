"use client";
import { TowerCard } from "@/components/towers/tower-card";
import type { Tower } from "@/features/towers/types";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function MyTowers() {
  const [towers, setTowers] = useState<Tower[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => { fetch("/api/supervisor/towers", { cache: "no-store" }).then(async (response) => { const data = await response.json() as { towers?: Tower[]; error?: string }; if (!response.ok) throw new Error(data.error); setTowers(data.towers ?? []); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar tus torres.")).finally(() => setLoading(false)); }, []);
  return <><header className="module-heading"><div><span className="eyebrow"><Building2 /> Asignaciones reales</span><h1>Mis torres</h1><p>Edificios residenciales asignados a tu supervisión.</p></div></header>{loading && <section className="card"><p>Cargando asignaciones…</p></section>}{error && <section className="card"><p className="form-error">{error}</p></section>}{!loading && !error && !towers.length && <section className="card empty-state"><Building2 /><h2>No tienes torres asignadas</h2><p>El administrador debe asignarte un edificio desde tu perfil.</p></section>}<div className="tower-card-grid supervisor">{towers.map((tower) => <TowerCard key={tower.id} tower={tower} role="supervisor" />)}</div></>;
}
