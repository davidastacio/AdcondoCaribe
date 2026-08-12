"use client";

import { useAuth } from "@/auth/auth-context";
import { Brand } from "./brand";
import { Bell, Building2, CalendarDays, CheckSquare2, ChevronDown, ClipboardList, FileBarChart, FileText, Home, LogOut, Menu, Package, Settings, ShieldAlert, ShoppingCart, UserRound, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const supervisorItems = [
  ["Inicio", "/supervisor", Home], ["Mis visitas", "/supervisor/visitas", CalendarDays], ["Mis torres", "/supervisor/torres", Building2],
  ["Checklists", "/supervisor/visitas", CheckSquare2], ["Incidencias", "/supervisor/incidencias", ShieldAlert], ["Reportes", "/supervisor/reportes", FileBarChart],
  ["Inventario", "/supervisor/inventario", Package], ["Solicitudes", "/supervisor/solicitudes", ShoppingCart], ["Documentos", "/supervisor/documentos", FileText], ["Perfil", "/supervisor/perfil", UserRound],
] as const;
const adminItems = [
  ["Dashboard", "/admin", Home], ["Torres", "/admin/torres", Building2], ["Supervisores", "/admin/supervisores", UsersRound], ["Visitas", "/admin/visitas", CalendarDays], ["Calendario", "/admin/calendario", CalendarDays],
  ["Checklists", "/admin/configuracion/checklist", ClipboardList], ["Incidencias", "/admin/incidencias", ShieldAlert], ["Reportes", "/admin/reportes", FileBarChart], ["Historial", "/admin/historial", FileText],
  ["Inventario", "/admin/inventario", Package], ["Solicitudes", "/admin/solicitudes", ShoppingCart], ["Documentos", "/admin/documentos", FileText], ["Usuarios", "/admin/usuarios", UserRound], ["Configuración", "/admin/configuracion", Settings],
] as const;

export function DashboardShell({ role, children }: { role: "supervisor" | "admin"; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { currentUser, signOut } = useAuth();
  const items = role === "supervisor" ? supervisorItems : adminItems;
  const person = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Usuario";
  const initials = currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : "--";
  return <div className="app-shell">
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="sidebar__head"><Brand light/><button onClick={() => setOpen(false)} className="sidebar__close" aria-label="Cerrar menú"><X/></button></div>
      <nav>{items.map(([label, href, Icon]) => { const active = pathname === href || (href !== "/supervisor" && href !== "/admin" && pathname.startsWith(`${href}/`)); return <Link key={label} href={href} className={active ? "active" : ""} onClick={() => setOpen(false)}><Icon size={18}/><span>{label}</span></Link>; })}</nav>
      <Link href="/login" className="sidebar__logout" onClick={signOut}><LogOut size={18}/> Cerrar sesión</Link>
    </aside>
    {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Cerrar menú"/>}
    <div className="app-main">
      <header className="topbar">
        <button className="menu-button" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu/></button>
        <span className="topbar__title">{role === "supervisor" ? "Mi jornada" : "Panel administrativo"}</span>
        <div className="topbar__actions"><Link href={role === "supervisor" ? "/supervisor" : "/admin"} className="notification" aria-label="Notificaciones"><Bell size={19}/><i>3</i></Link><div className="avatar">{initials}</div><div className="user"><strong>{person}</strong><small>{currentUser?.jobTitle ?? (role === "supervisor" ? "Supervisor" : "Administradora")}</small></div><ChevronDown size={16}/></div>
      </header>
      <main className="dashboard-content">{children}</main>
    </div>
  </div>;
}
