"use client";
import type { IncidentPhoto, IncidentPhotoType } from "@/features/incidents/types";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRef } from "react";
export function IncidentPhotoUploader({photos,onChange,type="GENERAL"}:{photos:IncidentPhoto[];onChange:(photos:IncidentPhoto[])=>void;type?:IncidentPhotoType}){
 const camera=useRef<HTMLInputElement>(null);const upload=useRef<HTMLInputElement>(null);
 const add=(files:FileList|null)=>{if(!files)return;const incoming=Array.from(files).map(file=>({id:crypto.randomUUID(),url:URL.createObjectURL(file),type,createdAt:new Date().toISOString()}));onChange([...photos,...incoming])};
 return <div className="incident-photo-uploader"><div className="incident-photo-actions"><button type="button" onClick={()=>camera.current?.click()}><Camera/>Tomar foto</button><button type="button" onClick={()=>upload.current?.click()}><ImagePlus/>Subir fotos</button></div><input hidden ref={camera} type="file" accept="image/*" capture="environment" onChange={e=>add(e.target.files)}/><input hidden ref={upload} type="file" accept="image/*" multiple onChange={e=>add(e.target.files)}/>{photos.length>0&&<div className="incident-upload-previews">{photos.map(photo=><div key={photo.id} className="evidence-photo" data-seed={photo.url.replace("mock-photo:","")} style={photo.url.startsWith("blob:")?{backgroundImage:`url(${photo.url})`}:undefined}><span>{photo.type}</span><button type="button" onClick={()=>onChange(photos.filter(p=>p.id!==photo.id))}><Trash2/></button></div>)}</div>}</div>
}
