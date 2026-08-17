"use client";
import { TowerForm } from "@/components/towers/tower-form";
import type { Tower, TowerInput } from "@/features/towers/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewTower() {
  const router = useRouter();
  async function createTower(input: TowerInput) { const response = await fetch("/api/admin/towers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }); const data = await response.json() as { tower?: Tower; error?: string }; if (!response.ok || !data.tower) throw new Error(data.error ?? "No se pudo crear la torre."); router.push(`/admin/torres/${data.tower.id}`); router.refresh(); }
  return <><header className="module-heading compact"><div><Link className="back-link" href="/admin/torres"><ArrowLeft /> Torres</Link><h1>Nueva torre residencial</h1><p>Registra manualmente la ficha maestra del edificio.</p></div></header><TowerForm onSubmit={createTower} /></>;
}
