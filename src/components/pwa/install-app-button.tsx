"use client";

import { Download, MonitorSmartphone, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent>();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    const capturePrompt = (event: Event) => { event.preventDefault(); setPromptEvent(event as InstallPromptEvent); };
    const markInstalled = () => { setInstalled(true); setPromptEvent(undefined); };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) { setInstructionsOpen(true); return; }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(undefined);
  };

  if (installed) return compact ? null : <span className="install-complete"><MonitorSmartphone/>Aplicación instalada</span>;

  return <>
    <button type="button" className={compact ? "btn btn--install" : "btn btn--white btn--large"} onClick={() => void install()}><Download size={compact ? 16 : 18}/>{compact ? "Instalar app" : "Instalar en este dispositivo"}</button>
    {instructionsOpen && <div className="install-overlay" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={() => setInstructionsOpen(false)}>
      <section className="install-dialog" onClick={event => event.stopPropagation()}>
        <button type="button" className="install-dialog__close" aria-label="Cerrar" onClick={() => setInstructionsOpen(false)}><X/></button>
        <span className="install-dialog__icon"><MonitorSmartphone/></span>
        <h2 id="install-title">Instala ADCONDO</h2>
        <p>Funciona como una aplicación en tu móvil o tablet, sin descargarla desde una tienda.</p>
        <ol>
          <li><b>iPhone o iPad:</b> abre esta página en Safari, toca <Share/> <strong>Compartir</strong> y selecciona <strong>“Añadir a pantalla de inicio”</strong>.</li>
          <li><b>Android:</b> abre el menú del navegador y selecciona <strong>“Instalar aplicación”</strong> o <strong>“Añadir a pantalla principal”</strong>.</li>
        </ol>
        <button type="button" className="btn btn--primary" onClick={() => setInstructionsOpen(false)}>Entendido</button>
      </section>
    </div>}
  </>;
}

