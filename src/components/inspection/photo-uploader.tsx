"use client";
import type { AnswerCondition } from "@/features/visits/types";
import { Camera, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

type Photo = { id: string; url: string };

export function PhotoUploader({ itemId, condition, photos, onChange }: { itemId: string; condition: AnswerCondition; photos: Photo[]; onChange: (photos: Photo[]) => void }) {
  const { visitId } = useParams<{ visitId: string }>();
  const camera = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const addFiles = async (files: FileList|null) => {
    if (!files?.length) return;
    setBusy(true); setError(""); const next = [...photos];
    try {
      for (const file of Array.from(files)) {
        const form = new FormData(); form.set("file", file); form.set("itemId", itemId); form.set("condition", condition);
        const response = await fetch(`/api/supervisor/visits/${visitId}/inspection/photos`, { method: "POST", body: form });
        const data = await response.json() as { photo?: Photo; error?: string };
        if (!response.ok || !data.photo) throw new Error(data.error ?? "No se pudo subir la fotografía.");
        next.push(data.photo); onChange([...next]);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo subir la fotografía."); }
    finally { setBusy(false); if (camera.current) camera.current.value=""; if (upload.current) upload.current.value=""; }
  };
  const remove = async (photo: Photo) => {
    setBusy(true); setError("");
    const response = await fetch(`/api/supervisor/visits/${visitId}/inspection/photos?photoId=${encodeURIComponent(photo.id)}`, { method: "DELETE" });
    const data = await response.json() as { error?: string };
    if (response.ok) onChange(photos.filter(item => item.id !== photo.id)); else setError(data.error ?? "No se pudo eliminar la fotografía.");
    setBusy(false);
  };
  return <div className="photo-uploader"><div className="photo-actions"><button type="button" disabled={busy} onClick={()=>camera.current?.click()}>{busy?<LoaderCircle/>:<Camera/>}Tomar foto</button><button type="button" disabled={busy} onClick={()=>upload.current?.click()}><ImagePlus/>Subir foto</button></div><input ref={camera} hidden type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={event=>void addFiles(event.target.files)}/><input ref={upload} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event=>void addFiles(event.target.files)}/>{error&&<small className="form-error">{error}</small>}{photos.length>0&&<div className="photo-previews">{photos.map(photo=><div key={photo.id} style={{backgroundImage:`url(${photo.url})`}}><button type="button" disabled={busy} aria-label="Eliminar fotografía" onClick={()=>void remove(photo)}><Trash2/></button></div>)}</div>}</div>;
}
