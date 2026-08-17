"use client";
import { TowerForm } from "@/components/towers/tower-form";
import type { Tower, TowerInput } from "@/features/towers/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditTower() {
  const { towerId } = useParams<{ towerId: string }>(), router = useRouter();
  const [tower, setTower] = useState<Tower>(), [error, setError] = useState("");
  useEffect(() => { fetch(`/api/admin/towers/${towerId}`, { cache: "no-store" }).then(async (response) => { const data = await response.json() as { tower?: Tower; error?: string }; if (!response.ok || !data.tower) throw new Error(data.error); setTower(data.tower); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Torre no encontrada.")); }, [towerId]);
  async function updateTower(input: TowerInput) { const response = await fetch(`/api/admin/towers/${towerId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error ?? "No se pudo actualizar la torre."); router.push(`/admin/torres/${towerId}`); router.refresh(); }
  if (error) return <section className="card"><p className="form-error">{error}</p></section>;
  if (!tower) return <section className="card"><p>Cargando torre…</p></section>;
  return <><header className="module-heading compact"><div><Link className="back-link" href={`/admin/torres/${towerId}`}><ArrowLeft /> {tower.name}</Link><h1>Editar torre</h1><p>Los cambios se guardarán en Supabase.</p></div></header><TowerForm tower={tower} onSubmit={updateTower} /></>;
}
