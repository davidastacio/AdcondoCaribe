import { Brand } from "@/components/brand";
import { ArrowRight, BarChart3, Building2, Camera, Check, CheckCircle2, ClipboardCheck, FileClock, Menu, PackageCheck, Play, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  [ClipboardCheck, "Checklists digitales", "Inspecciones guiadas por áreas, simples de completar desde el móvil."],
  [FileClock, "Seguimiento de visitas", "Agenda, estado y trazabilidad de cada recorrido en tiempo real."],
  [ShieldCheck, "Reportes e incidencias", "Detecta, asigna y da seguimiento a cada hallazgo hasta su cierre."],
  [Camera, "Fotografías y evidencias", "Captura evidencias directamente en el punto que estás verificando."],
  [PackageCheck, "Inventario y materiales", "Controla existencias y solicita únicamente lo que hace falta."],
  [BarChart3, "Reportes administrativos", "Convierte cada visita en información clara para tomar decisiones."],
];

export default function LandingPage() {
  return <div className="landing">
    <header className="site-header"><div className="container site-header__inner"><Brand/><nav><a href="#inicio">Inicio</a><a href="#funcionalidades">Funcionalidades</a><a href="#beneficios">Beneficios</a><a href="#contacto">Contacto</a></nav><div className="site-header__actions"><Link className="btn btn--ghost" href="/login">Iniciar sesión</Link><a className="btn btn--primary" href="#contacto">Solicitar demo</a></div><button className="mobile-menu" aria-label="Abrir menú"><Menu/></button></div></header>
    <main>
      <section id="inicio" className="hero"><Image src="/assets/residential-hero.png" alt="Edificio residencial moderno en el Caribe" fill priority sizes="100vw" className="hero__image"/><div className="hero__wash"/><div className="container hero__content"><div className="eyebrow"><Building2 size={14}/> Supervisión residencial inteligente</div><h1>Supervisa. Controla.<br/><span>Mantén todo en orden.</span></h1><p>La plataforma para administrar visitas, checklists, incidencias y materiales de tus torres residenciales, desde cualquier lugar.</p><div className="hero__actions"><Link href="/login" className="btn btn--primary btn--large">Comenzar ahora <ArrowRight size={18}/></Link><a href="#funcionalidades" className="btn btn--white btn--large"><Play size={17}/> Ver cómo funciona</a></div><div className="hero__trust"><span><CheckCircle2/> Visitas trazables</span><span><CheckCircle2/> Evidencia centralizada</span><span><CheckCircle2/> Diseñado para móvil</span></div></div></section>
      <section id="funcionalidades" className="section features"><div className="container"><div className="section-heading"><span>Todo bajo control</span><h2>Una plataforma que acompaña cada recorrido</h2><p>De la planificación al cierre: información clara, evidencia organizada y seguimiento sin papeleo.</p></div><div className="feature-grid">{features.map(([Icon,title,text])=><article className="feature-card" key={title as string}><span><Icon/></span><h3>{title as string}</h3><p>{text as string}</p><a href="#contacto">Conocer más <ArrowRight size={15}/></a></article>)}</div></div></section>
      <section id="beneficios" className="section workflow"><div className="container workflow__grid"><div><span className="section-kicker">Supervisión sin fricción</span><h2>De la agenda al reporte, todo conectado.</h2><p>Los supervisores saben dónde ir y qué revisar. La administración ve lo que ocurre y puede actuar a tiempo.</p><ul><li><Check/> Agenda y ruta diaria por supervisor</li><li><Check/> Checklist basado en la metodología real de ADCONDO</li><li><Check/> Incidencias con prioridad, responsable y evidencia</li><li><Check/> Historial cronológico de cada edificio</li></ul><Link href="/login" className="btn btn--navy">Explorar la plataforma <ArrowRight size={17}/></Link></div><div className="workflow__visual"><div className="mini-window"><div className="mini-window__bar"><i/><i/><i/><span>Resumen de supervisión</span></div><div className="mini-kpis"><b>18<small>Torres</small></b><b>7<small>Completadas</small></b><b>2<small>Incidencias</small></b></div><div className="mini-list"><span><i className="green"/>Tree Tower III <em>Completada</em></span><span><i className="orange"/>Torre Verde Mare <em>En progreso</em></span><span><i className="blue"/>Villa del Piantini <em>Programada</em></span></div></div></div></div></section>
    </main>
    <footer id="contacto"><div className="container footer__inner"><Brand light/><p>Supervisión inteligente para edificios residenciales.</p><div><a href="#funcionalidades">Funcionalidades</a><a href="#beneficios">Beneficios</a><a href="mailto:info@adcondodelcaribe.com">Contacto</a></div></div></footer>
  </div>;
}
