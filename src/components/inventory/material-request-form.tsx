"use client";
import { createRequest, inventoryByTower } from "@/features/inventory/service";
import { inventoryTowers } from "@/features/inventory/mock-data";
import type { RequestItem } from "@/features/inventory/types";
import { Minus, Plus, Send, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function MaterialRequestForm({initialTowerId,initialItemIds=[]}:{initialTowerId?:string;initialItemIds?:string[]}) {
  const router=useRouter(); const [towerId,setTowerId]=useState(initialTowerId??inventoryTowers[0].id); const [selected,setSelected]=useState<string[]>(initialItemIds); const [observation,setObservation]=useState("");
  const inventory=useMemo(()=>inventoryByTower(towerId),[towerId]);
  const [quantities,setQuantities]=useState<Record<string,number>>({});
  const toggle=(id:string)=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  const submit=(draft=false)=>{const tower=inventoryTowers.find(t=>t.id===towerId)!; const items:RequestItem[]=inventory.filter(i=>selected.includes(i.inventoryItemId)).map(i=>({id:crypto.randomUUID(),inventoryItemId:i.inventoryItemId,itemName:i.itemName,unit:i.unit,currentQuantity:i.quantity,requestedQuantity:quantities[i.id]??Math.max(1,i.recommendedQuantity-i.quantity),observation:i.observation,photos:i.photos})); if(!items.length)return; const req=createRequest(tower.id,tower.name,tower.code,items,observation,draft?"DRAFT":"SUBMITTED"); router.push(`/supervisor/solicitudes/${req.id}`)};
  return <section className="request-form card"><label>Torre residencial<select value={towerId} onChange={e=>{setTowerId(e.target.value);setSelected([])}}>{inventoryTowers.map(t=><option key={t.id} value={t.id}>{t.name} · {t.sector}</option>)}</select></label><div className="request-materials"><h2>Selecciona los materiales</h2>{inventory.map(item=>{const active=selected.includes(item.inventoryItemId);return <article key={item.id} className={active?"selected":""}><button type="button" className="material-select" onClick={()=>toggle(item.inventoryItemId)}><span>{item.itemName}<small>Existencia: {item.quantity} {item.unit}</small></span><i>{active?"✓":"+"}</i></button>{active&&<div className="quantity-stepper"><button onClick={()=>setQuantities(q=>({...q,[item.id]:Math.max(1,(q[item.id]??Math.max(1,item.recommendedQuantity-item.quantity))-1)}))}><Minus/></button><b>{quantities[item.id]??Math.max(1,item.recommendedQuantity-item.quantity)}</b><button onClick={()=>setQuantities(q=>({...q,[item.id]:(q[item.id]??Math.max(1,item.recommendedQuantity-item.quantity))+1}))}><Plus/></button><span>{item.unit}</span></div>}</article>})}</div><label>Observación general<textarea value={observation} onChange={e=>setObservation(e.target.value)} placeholder="Indica para qué se necesitan los materiales..."/></label><div className="request-actions"><button className="btn btn--soft" disabled={!selected.length} onClick={()=>submit(true)}><Save/> Guardar borrador</button><button className="btn btn--primary" disabled={!selected.length} onClick={()=>submit(false)}><Send/> Enviar solicitud</button></div></section>
}
