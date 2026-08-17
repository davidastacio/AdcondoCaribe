"use client";

import { UserForm, type UserFormValue } from "@/components/users/user-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewUserPage() {
  const router = useRouter();
  async function createUser(value: UserFormValue) {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(value),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error ?? "No se pudo crear el usuario.");
    router.push("/admin/usuarios");
    router.refresh();
  }
  return <><header className="module-heading compact"><div><Link className="back-link" href="/admin/usuarios"><ArrowLeft /> Usuarios</Link><h1>Nuevo usuario</h1></div></header><UserForm onSubmit={createUser} /></>;
}
