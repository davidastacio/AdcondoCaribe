import type { TowerInventory } from "@/features/inventory/types";
import { ChevronRight, MapPin, Package } from "lucide-react";
import { InventoryStatusBadge } from "./badges";
export function InventoryItemRow({item,onEdit}:{item:TowerInventory;onEdit:(item:TowerInventory)=>void}){return <button className="inventory-item-row" onClick={()=>onEdit(item)}><span className="inventory-item-icon"><Package/></span><span><strong>{item.itemName}</strong><small><MapPin/>{item.location||"Sin ubicación"}</small></span><span className="inventory-quantity"><b>{item.quantity}</b>{item.unit}</span><InventoryStatusBadge status={item.status}/><ChevronRight/></button>}
