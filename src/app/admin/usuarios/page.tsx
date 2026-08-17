"use client";

import { UserCard } from "@/components/users/user-card";
import type { AppUser } from "@/features/users/types";
import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { users?: AppUser[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los usuarios.");
        setUsers(data.users ?? []);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los usuarios."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => users.filter((user) =>
    (role === "ALL" || user.role === role) &&
    (status === "ALL" || user.status === status) &&
    `${user.firstName} ${user.lastName} ${user.email} ${user.phone ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  ), [users, query, role, status]);

  return <>
    <header className="module-heading"><div><span className="eyebrow"><Users /> Acceso a la plataforma</span><h1>Usuarios del sistema</h1><p>Administra identidades, roles y estados de acceso reales.</p></div><Link className="btn btn--primary" href="/admin/usuarios/nuevo"><Plus /> Nuevo usuario</Link></header>
    <div className="user-kpis">{[[users.length,"Total usuarios"],[users.filter((u)=>u.role==="ADMIN").length,"Administradores"],[users.filter((u)=>u.role==="SUPERVISOR").length,"Supervisores"],[users.filter((u)=>u.status==="ACTIVE").length,"Activos"],[users.filter((u)=>u.status!=="ACTIVE").length,"Inactivos"]].map(([number,label])=><article key={String(label)}><b>{number}</b><span>{label}</span></article>)}</div>
    <section className="card user-filters"><label><Search /><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar nombre, correo o teléfono..." /></label><select value={role} onChange={(e)=>setRole(e.target.value)}><option value="ALL">Todos los roles</option><option value="ADMIN">Administrador</option><option value="SUPERVISOR">Supervisor</option></select><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="ALL">Todos los estados</option>{["ACTIVE","INACTIVE","SUSPENDED","PENDING"].map((value)=><option key={value}>{value}</option>)}</select></section>
    {loading && <section className="card"><p>Cargando usuarios…</p></section>}
    {error && <section className="card"><p className="form-error" role="alert">{error}</p></section>}
    {!loading && !error && <div className="user-card-grid">{filtered.map((user)=><UserCard key={user.id} user={user} />)}</div>}
  </>;
}
