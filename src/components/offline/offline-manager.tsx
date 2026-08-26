"use client";

import { getFirebaseClientAuth } from "@/lib/firebase/client";
import { pendingOfflineCount, syncOfflineRequests } from "@/lib/offline/client";
import { Cloud, CloudOff, LoaderCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function OfflineManager() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(() => {
    void pendingOfflineCount().then(setPending).catch(() => undefined);
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      const firebaseUser = getFirebaseClientAuth().currentUser;
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken(true);
        await fetch("/api/auth/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken }) });
      }
      const result = await syncOfflineRequests();
      setPending(result.pending);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  useEffect(() => {
    setOnline(navigator.onLine);
    refreshCount();
    const handleOnline = () => { setOnline(true); void sync(); };
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("adcondo:offline-queue", refreshCount);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("adcondo:offline-queue", refreshCount);
    };
  }, [refreshCount, sync]);

  useEffect(() => { if (online && pending > 0) void sync(); }, [online, pending, sync]);

  if (online && pending === 0 && !syncing) return null;
  return <div className={`offline-status ${online ? "offline-status--pending" : "offline-status--disconnected"}`} role="status">
    {syncing ? <LoaderCircle className="offline-status__spin"/> : online ? <Cloud/> : <CloudOff/>}
    <span>{syncing ? "Sincronizando cambios…" : online ? `${pending} cambio${pending === 1 ? "" : "s"} pendiente${pending === 1 ? "" : "s"}` : `Sin conexión · ${pending ? `${pending} cambio${pending === 1 ? "" : "s"} guardado${pending === 1 ? "" : "s"}` : "puedes continuar trabajando"}`}</span>
    {online && pending > 0 && !syncing && <button type="button" onClick={() => void sync()}><RefreshCw/>Sincronizar</button>}
  </div>;
}

