"use client";
import type { IncidentPhoto } from "@/features/incidents/types";
import { Camera, X } from "lucide-react";
import { useState } from "react";
const labels={BEFORE:"Antes",AFTER:"Después",GENERAL:"General"};
export function PhotoGallery({photos}:{photos:IncidentPhoto[]}){const [selected,setSelected]=useState<IncidentPhoto|null>(null);return <><div className="photo-gallery">{photos.map(photo=><button key={photo.id} className="gallery-photo evidence-photo" data-seed={photo.url.replace("mock-photo:","")} style={photo.url.startsWith("blob:")?{backgroundImage:`url(${photo.url})`}:undefined} onClick={()=>setSelected(photo)}><span className={`photo-type photo-type--${photo.type.toLowerCase()}`}>{labels[photo.type]}</span><Camera/></button>)}</div>{selected&&<div className="photo-lightbox" onClick={()=>setSelected(null)}><button><X/></button><div className="lightbox-photo evidence-photo" data-seed={selected.url.replace("mock-photo:","")} style={selected.url.startsWith("blob:")?{backgroundImage:`url(${selected.url})`}:undefined}/><span>{labels[selected.type]} · {new Date(selected.createdAt).toLocaleDateString("es-DO")}</span></div>}</>}
