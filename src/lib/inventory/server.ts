import type { InventoryCategory, InventoryStatus, TowerInventory } from "@/features/inventory/types";
import { supabaseServerFetch } from "@/lib/database/verified-request";

type TowerRow={id:string;name:string;code:string;sector:string|null};
type ItemRow={id:string;name:string;category_id:string;unit_id:string};
type CatalogRow={id:string;code:string;label:string};
type InventoryRow={id:string;tower_id:string;inventory_item_id:string;quantity:number;recommended_quantity:number|null;location:string|null;observation:string|null;stock_status:InventoryStatus;last_checked_by_id:string|null;last_checked_at:string|null};
type UserRow={id:string;first_name:string;last_name:string};
type PhotoRow={id:string;tower_inventory_id:string;created_at:string};

const categoryCodes=new Set<InventoryCategory>(["CLEANING","HYGIENE","POOL","ELECTRICITY","MAINTENANCE","OTHER"]);
export async function fetchRealInventory(towerIds?:string[]):Promise<TowerInventory[]>{
  if(towerIds&&towerIds.length===0)return [];
  const towerFilter=towerIds?`&tower_id=in.(${towerIds.join(",")})`:"";
  const [inventoryResponse,towerResponse,itemResponse,catalogResponse,userResponse,photoResponse]=await Promise.all([
    supabaseServerFetch(`tower_inventory?select=id,tower_id,inventory_item_id,quantity,recommended_quantity,location,observation,stock_status,last_checked_by_id,last_checked_at${towerFilter}&order=updated_at.desc`),
    supabaseServerFetch("towers?select=id,name,code,sector"),supabaseServerFetch("inventory_items?select=id,name,category_id,unit_id&active=eq.true"),
    supabaseServerFetch("catalog_items?select=id,code,label&catalog_type=in.(INVENTORY_CATEGORY,UNIT)"),
    supabaseServerFetch("users?select=id,first_name,last_name"),supabaseServerFetch("inventory_photos?select=id,tower_inventory_id,created_at&deleted_at=is.null")
  ]);
  if(![inventoryResponse,towerResponse,itemResponse,catalogResponse,userResponse,photoResponse].every(response=>response.ok))throw new Error("No se pudo consultar el inventario.");
  const rows=await inventoryResponse.json() as InventoryRow[],towers=new Map((await towerResponse.json() as TowerRow[]).map(row=>[row.id,row])),items=new Map((await itemResponse.json() as ItemRow[]).map(row=>[row.id,row])),catalogs=new Map((await catalogResponse.json() as CatalogRow[]).map(row=>[row.id,row])),users=new Map((await userResponse.json() as UserRow[]).map(row=>[row.id,row])),photos=await photoResponse.json() as PhotoRow[];
  return rows.map(row=>{const tower=towers.get(row.tower_id),item=items.get(row.inventory_item_id),category=item?catalogs.get(item.category_id):undefined,unit=item?catalogs.get(item.unit_id):undefined,checker=row.last_checked_by_id?users.get(row.last_checked_by_id):undefined;const code=category?.code as InventoryCategory;return{id:row.id,towerId:row.tower_id,towerName:tower?.name??"Torre",towerCode:tower?.code??"",sector:tower?.sector??"",inventoryItemId:row.inventory_item_id,itemName:item?.name??"Material",category:categoryCodes.has(code)?code:"OTHER",quantity:Number(row.quantity),recommendedQuantity:Number(row.recommended_quantity??0),unit:unit?.label.toLowerCase()??"unidad",status:row.stock_status,location:row.location??"",observation:row.observation??undefined,photos:photos.filter(photo=>photo.tower_inventory_id===row.id).map(photo=>({id:photo.id,url:`/api/inventory/${row.id}/photos/${photo.id}`,createdAt:photo.created_at})),lastCheckedById:row.last_checked_by_id??undefined,lastCheckedBy:checker?`${checker.first_name} ${checker.last_name}`:undefined,lastCheckedAt:row.last_checked_at??undefined};});
}
