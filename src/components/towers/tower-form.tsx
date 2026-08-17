"use client";

import type { Tower, TowerContact, TowerInput, TowerStatus, TowerType } from "@/features/towers/types";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

const empty: TowerInput = { name: "", type: "TOWER", address: "", sector: "", city: "Santo Domingo", province: "Distrito Nacional", status: "ACTIVE", hasPool: false, hasGym: false, hasSocialArea: true, hasGenerator: true, hasElevators: true, hasCameras: true, hasWaterTank: true, hasPumps: true, contacts: [], supervisors: [] };
const numericFields = [["floors", "Pisos"], ["apartments", "Apartamentos"], ["elevators", "Ascensores"], ["parkingSpaces", "Parqueos"], ["yearBuilt", "Año de construcción"], ["blocks", "Bloques"]] as const;
const featureFields = [["hasPool", "Piscina"], ["hasGym", "Gimnasio"], ["hasSocialArea", "Área social"], ["hasGenerator", "Planta eléctrica"], ["hasElevators", "Ascensores"], ["hasCameras", "Cámaras"], ["hasWaterTank", "Cisterna"], ["hasPumps", "Bombas"]] as const;

export function TowerForm({ tower, onSubmit }: { tower?: Tower; onSubmit: (input: TowerInput) => void | Promise<void> }) {
  const [data, setData] = useState<TowerInput>(tower ? { ...tower } : empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof TowerInput>(key: K, value: TowerInput[K]) => setData((current) => ({ ...current, [key]: value }));
  const addContact = () => set("contacts", [...data.contacts, { id: crypto.randomUUID(), type: "Otro contacto", name: "", phone: "", email: "" }]);
  const updateContact = (id: string, key: keyof TowerContact, value: string) => set("contacts", data.contacts.map((item) => item.id === id ? { ...item, [key]: value } : item));

  return <form className="tower-form" onSubmit={async (event) => { event.preventDefault(); setError(""); setSaving(true); try { await onSubmit(data); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "No se pudo guardar la torre."); } finally { setSaving(false); } }}>
    <section className="card"><h2>Información general</h2><div className="form-grid">
      <label>Nombre de la torre *<input required value={data.name} onChange={(event) => set("name", event.target.value)} /></label>
      <label>Código<input value={data.code ?? ""} disabled={Boolean(tower)} placeholder="Autogenerado" onChange={(event) => set("code", event.target.value)} /></label>
      <label>Tipo<select value={data.type} onChange={(event) => set("type", event.target.value as TowerType)}><option value="TOWER">Torre residencial</option><option value="CONDOMINIUM">Condominio</option><option value="RESIDENTIAL">Residencial</option></select></label>
      <label>Estado<select value={data.status} onChange={(event) => set("status", event.target.value as TowerStatus)}><option value="ACTIVE">Activa</option><option value="OBSERVATION">En observación</option><option value="MAINTENANCE">Mantenimiento</option><option value="INACTIVE">Inactiva</option></select></label>
      <label className="span-2">Dirección *<input required value={data.address} onChange={(event) => set("address", event.target.value)} /></label>
      <label>Sector *<input required value={data.sector} onChange={(event) => set("sector", event.target.value)} /></label>
      <label>Ciudad *<input required value={data.city} onChange={(event) => set("city", event.target.value)} /></label>
      <label>Provincia<input value={data.province} onChange={(event) => set("province", event.target.value)} /></label>
      <label>Referencia de ubicación<input value={data.locationReference ?? ""} onChange={(event) => set("locationReference", event.target.value)} /></label>
    </div></section>
    <section className="card"><h2>Información del edificio</h2><div className="form-grid numeric">{numericFields.map(([key, label]) => <label key={key}>{label}<input type="number" min="0" value={data[key] ?? ""} onChange={(event) => set(key, event.target.value === "" ? undefined : Number(event.target.value))} /></label>)}</div><div className="feature-grid">{featureFields.map(([key, label]) => <label key={key}><input type="checkbox" checked={data[key]} onChange={(event) => set(key, event.target.checked)} />{label}</label>)}</div></section>
    <section className="card"><div className="section-action"><h2>Contactos de la torre</h2><button type="button" className="btn btn--soft" onClick={addContact}><Plus /> Añadir contacto</button></div>{data.contacts.map((item) => <div className="contact-form-row" key={item.id}><input required placeholder="Tipo de contacto" value={item.type} onChange={(event) => updateContact(item.id, "type", event.target.value)} /><input required placeholder="Nombre" value={item.name} onChange={(event) => updateContact(item.id, "name", event.target.value)} /><input placeholder="Teléfono" value={item.phone} onChange={(event) => updateContact(item.id, "phone", event.target.value)} /><input type="email" placeholder="Correo" value={item.email} onChange={(event) => updateContact(item.id, "email", event.target.value)} /><button type="button" aria-label="Eliminar contacto" onClick={() => set("contacts", data.contacts.filter((contact) => contact.id !== item.id))}><Trash2 /></button></div>)}</section>
    <section className="card"><h2>Notas generales</h2><textarea rows={4} value={data.notes ?? ""} onChange={(event) => set("notes", event.target.value)} placeholder="Indicaciones de acceso, llaves, áreas especiales..." /></section>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn btn--primary form-submit" disabled={saving}><Save /> {saving ? "Guardando…" : tower ? "Guardar cambios" : "Crear torre"}</button>
  </form>;
}
