"use client";

import { UserForm, type UserFormValue } from "@/components/users/user-form";
import { AssignmentManager } from "@/components/users/assignment-manager";
import type { AppUser } from "@/features/users/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { user?: AppUser; error?: string };
        if (!response.ok || !data.user) throw new Error(data.error ?? "Usuario no encontrado.");
        setUser(data.user);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Usuario no encontrado."));
  }, [userId]);

  async function updateUser(value: UserFormValue) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(value),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error ?? "No se pudo actualizar el usuario.");
    router.push("/admin/usuarios");
    router.refresh();
  }

  return <>
    <header className="module-heading compact"><div><Link className="back-link" href="/admin/usuarios"><ArrowLeft /> Usuarios</Link><h1>Editar usuario</h1></div></header>
    {error && <section className="card"><p className="form-error">{error}</p></section>}
    {!user && !error && <section className="card"><p>Cargando usuario…</p></section>}
    {user && <><UserForm user={user} onSubmit={updateUser} />{user.role !== "ADMIN" && <AssignmentManager supervisorId={user.id} />}</>}
  </>;
}
