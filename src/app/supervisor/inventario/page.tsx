"use client";
import { InventoryCard } from "@/components/inventory/inventory-card";
import { inventoryTowers } from "@/features/inventory/mock-data";
import { listInventory } from "@/features/inventory/service";
import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { useEffect,useState } from "react";
import type { TowerInventory } from "@/features/inventory/types";
export default function SupervisorInventoryPage(){const [items,setItems]=useState<TowerInventory[]>([]);useEffect(()=>setItems(listInventory()),[]);return <><header className="module-heading"><div><span className="eyebrow"><PackageSearch/> Control de materiales</span><h1>Inventario de mis torres</h1><p>Verifica las existencias físicas y solicita reposición cuando sea necesario.</p></div><Link className="btn btn--primary" href="/supervisor/solicitudes/nueva">Nueva solicitud</Link></header><div className="inventory-card-grid">{inventoryTowers.map(t=><InventoryCard key={t.id} towerId={t.id} towerName={t.name} towerCode={t.code} sector={t.sector} items={items.filter(i=>i.towerId===t.id)}/>)}</div></>}
