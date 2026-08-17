"use client";

import { useAuth } from "@/auth/auth-context";
import { Brand } from "@/components/brand";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      window.location.assign(user.role === "ADMIN" ? "/admin" : "/supervisor");
    } catch {
      setError("Correo, contraseña o permisos incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-page"><section className="login-panel"><div className="login-panel__brand"><Brand/></div><div className="login-form-wrap"><div className="login-heading"><span className="login-icon"><ShieldCheck/></span><h1>Bienvenido de nuevo</h1><p>Ingresa a tu espacio de supervisión.</p></div><form onSubmit={handleSubmit}><label>Correo electrónico<div className="input-wrap"><Mail/><input type="email" value={email} onChange={(event)=>setEmail(event.target.value)} autoComplete="email" required/></div></label><label>Contraseña<div className="input-wrap"><LockKeyhole/><input type={show?"text":"password"} value={password} onChange={(event)=>setPassword(event.target.value)} autoComplete="current-password" required/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Ocultar contraseña":"Mostrar contraseña"}>{show?<EyeOff/>:<Eye/>}</button></div></label><div className="form-options"><label><input type="checkbox"/> Recordarme</label><span>Recuperar contraseña</span></div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="btn btn--primary login-submit" disabled={loading}>{loading?"Validando…":"Iniciar sesión"} {!loading&&<ArrowRight/>}</button></form><p className="demo-note">Acceso seguro para personal autorizado de ADCONDO.</p></div><Link href="/" className="login-back">← Volver al inicio</Link></section><section className="login-cover"><div className="login-cover__content"><div className="eyebrow eyebrow--dark">Operación en tiempo real</div><h2>Cada visita.<br/>Cada detalle.<br/><span>Siempre bajo control.</span></h2><p>Supervisión residencial organizada, trazable y lista para acompañar a tu equipo.</p><div className="quote-card"><strong>“Ahora vemos el estado real de cada edificio sin esperar al reporte de fin de día.”</strong><span>Equipo de Operaciones · ADCONDO</span></div></div></section></main>;
}
