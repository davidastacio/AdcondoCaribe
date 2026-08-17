"use client";

import { UserCard } from "@/components/users/user-card";
import type { AppUser } from "@/features/users/types";
import { UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

export default function SupervisorsPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { users?: AppUser[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los supervisores.");
        setUsers((data.users ?? []).filter((user) => user.role === "SUPERVISOR"));
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los supervisores."));
  }, []);
  return <><header className="module-heading"><div><span className="eyebrow"><UsersRound /> Equipo de campo</span><h1>Supervisores</h1><p>Perfiles reales del equipo registrados en Firebase y Supabase.</p></div></header>{error && <section className="card"><p className="form-error">{error}</p></section>}<div className="user-card-grid">{users.map((user)=><UserCard key={user.id} user={user} supervisor stats={{ towers: 0, visits: 0, incidents: 0 }} />)}</div></>;
}
