"use client";
import { Brand } from "@/components/brand";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/auth/auth-context";

export default function LoginPage(){
  const { signInMock } = useAuth();
  const [show,setShow]=useState(false); const [role,setRole]=useState<"supervisor"|"admin">("supervisor");
  return <main className="login-page"><section className="login-panel"><div className="login-panel__brand"><Brand/></div><div className="login-form-wrap"><div className="login-heading"><span className="login-icon"><ShieldCheck/></span><h1>Bienvenido de nuevo</h1><p>Ingresa a tu espacio de supervisión.</p></div><div className="role-switch"><button type="button" className={role==="supervisor"?"active":""} onClick={()=>setRole("supervisor")}>Supervisor</button><button type="button" className={role==="admin"?"active":""} onClick={()=>setRole("admin")}>Administrador</button></div><form onSubmit={(e)=>{e.preventDefault(); signInMock(role==="supervisor"?"SUPERVISOR":"ADMIN"); location.href=role==="supervisor"?"/supervisor":"/admin"}}><label>Correo electrónico<div className="input-wrap"><Mail/><input type="email" defaultValue={role==="supervisor"?"juan@adcondo.com":"admin@adcondo.com"} required/></div></label><label>Contraseña<div className="input-wrap"><LockKeyhole/><input type={show?"text":"password"} defaultValue="adcondo2026" required/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Ocultar contraseña":"Mostrar contraseña"}>{show?<EyeOff/>:<Eye/>}</button></div></label><div className="form-options"><label><input type="checkbox"/> Recordarme</label><span title="Se habilitará con Firebase Authentication">Recuperación próximamente</span></div><button className="btn btn--primary login-submit">Iniciar sesión <ArrowRight/></button></form><p className="demo-note">Demo visual · Puedes ingresar con los datos precargados</p></div><Link href="/" className="login-back">← Volver al inicio</Link></section><section className="login-cover"><div className="login-cover__content"><div className="eyebrow eyebrow--dark">Operación en tiempo real</div><h2>Cada visita.<br/>Cada detalle.<br/><span>Siempre bajo control.</span></h2><p>Supervisión residencial organizada, trazable y lista para acompañar a tu equipo.</p><div className="quote-card"><strong>“Ahora vemos el estado real de cada edificio sin esperar al reporte de fin de día.”</strong><span>Equipo de Operaciones · ADCONDO</span></div></div></section></main>
}


