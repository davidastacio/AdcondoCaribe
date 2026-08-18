"use client";
import type { IncidentPhoto } from "@/features/incidents/types";
import { Camera, X } from "lucide-react";
import { useState } from "react";
const labels={BEFORE:"Antes",AFTER:"Después",GENERAL:"General"};
export function PhotoGallery({photos}:{photos:IncidentPhoto[]}){const [selected,setSelected]=useState<IncidentPhoto|null>(null);const style=(url:string)=>url.startsWith("blob:")||url.startsWith("/api/")?{backgroundImage:`url(${url})`}:undefined;return <><div className="photo-gallery">{photos.map(photo=><button key={photo.id} className="gallery-photo evidence-photo" data-seed={photo.url.replace("mock-photo:","")} style={style(photo.url)} onClick={()=>setSelected(photo)}><span className={`photo-type photo-type--${photo.type.toLowerCase()}`}>{labels[photo.type]}</span><Camera/></button>)}</div>{selected&&<div className="photo-lightbox" onClick={()=>setSelected(null)}><button><X/></button><div className="lightbox-photo evidence-photo" data-seed={selected.url.replace("mock-photo:","")} style={style(selected.url)}/><span>{labels[selected.type]} · {new Date(selected.createdAt).toLocaleDateString("es-DO")}</span></div>}</>}
