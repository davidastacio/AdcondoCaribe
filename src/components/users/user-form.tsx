"use client";

import type { AppUser, AppRole, UserInput, UserStatus } from "@/features/users/types";
import { Camera, Save } from "lucide-react";
import { useState } from "react";

export type UserFormValue = UserInput & { temporaryPassword?: string };

const empty: UserFormValue = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  jobTitle: "",
  role: "SUPERVISOR",
  status: "ACTIVE",
  notes: "",
  temporaryPassword: "",
};

export function UserForm({
  user,
  onSubmit,
  profile = false,
}: {
  user?: AppUser;
  onSubmit: (value: UserFormValue) => void | Promise<void>;
  profile?: boolean;
}) {
  const [data, setData] = useState<UserFormValue>(user ? { ...user } : empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof UserFormValue>(key: K, value: UserFormValue[K]) =>
    setData((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="user-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setSaving(true);
        try {
          await onSubmit(data);
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "No se pudo guardar el usuario.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <section className="card user-form-main">
        <div className="avatar-upload">
          <span>{data.firstName[0] ?? "U"}{data.lastName[0] ?? ""}</span>
          <label><Camera /> Foto<input type="file" accept="image/*" hidden /></label>
        </div>
        <div className="form-grid">
          <label>Nombre *<input required value={data.firstName} onChange={(e) => set("firstName", e.target.value)} /></label>
          <label>Apellido *<input required value={data.lastName} onChange={(e) => set("lastName", e.target.value)} /></label>
          <label>Correo *<input type="email" required disabled={!!user} value={data.email} onChange={(e) => set("email", e.target.value)} /></label>
          {!user && <label>Contraseña temporal *<input type="password" required minLength={6} autoComplete="new-password" value={data.temporaryPassword ?? ""} onChange={(e) => set("temporaryPassword", e.target.value)} /></label>}
          <label>Teléfono<input value={data.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></label>
          <label>Cargo<input value={data.jobTitle ?? ""} onChange={(e) => set("jobTitle", e.target.value)} /></label>
          {!profile && <>
            <label>Rol *<select value={data.role} onChange={(e) => set("role", e.target.value as AppRole)}><option value="ADMIN">Administrador</option><option value="SUPERVISOR">Supervisor</option></select></label>
            <label>Estado<select value={data.status} onChange={(e) => set("status", e.target.value as UserStatus)}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="SUSPENDED">Suspendido</option><option value="PENDING">Pendiente</option></select></label>
          </>}
        </div>
        <label>Notas<textarea rows={4} value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></label>
        {!user && <p className="auth-future-note">La identidad se creará inmediatamente en Firebase y el acceso quedará controlado por el estado seleccionado.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn--primary" disabled={saving}><Save /> {saving ? "Guardando…" : profile ? "Guardar perfil" : user ? "Guardar cambios" : "Crear usuario"}</button>
      </section>
    </form>
  );
}
