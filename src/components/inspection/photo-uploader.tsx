"use client";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRef } from "react";

export function PhotoUploader({photos,onChange}:{photos:string[];onChange:(photos:string[])=>void}){
  const camera=useRef<HTMLInputElement>(null); const upload=useRef<HTMLInputElement>(null);
  const addFiles=(files:FileList|null)=>{if(!files)return; Array.from(files).forEach(file=>{const reader=new FileReader();reader.onload=()=>onChange([...photos,String(reader.result)]);reader.readAsDataURL(file)})};
  return <div className="photo-uploader"><div className="photo-actions"><button type="button" onClick={()=>camera.current?.click()}><Camera/>Tomar foto</button><button type="button" onClick={()=>upload.current?.click()}><ImagePlus/>Subir foto</button></div><input ref={camera} hidden type="file" accept="image/*" capture="environment" onChange={e=>addFiles(e.target.files)}/><input ref={upload} hidden type="file" accept="image/*" multiple onChange={e=>addFiles(e.target.files)}/>{photos.length>0&&<div className="photo-previews">{photos.map((photo,index)=><div key={`${photo.slice(-12)}-${index}`} style={{backgroundImage:`url(${photo})`}}><button type="button" aria-label="Eliminar fotografía" onClick={()=>onChange(photos.filter((_,i)=>i!==index))}><Trash2/></button></div>)}</div>}</div>
}
