import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { fetchRealInventory } from "@/lib/inventory/server";
import { fetchRealTowers } from "@/lib/towers/server";
export const runtime="nodejs";
export async function GET(){const user=await getServerSessionUser();if(!user)return Response.json({error:"No autorizado."},{status:403});try{let towerIds:string[]|undefined;if(user.role!=="ADMIN"){const response=await supabaseServerFetch(`tower_assignments?select=tower_id&supervisor_id=eq.${user.id}&status=eq.ACTIVE`);towerIds=response.ok?(await response.json() as {tower_id:string}[]).map(row=>row.tower_id):[];}const towers=(await fetchRealTowers()).filter(tower=>!towerIds||towerIds.includes(tower.id));return Response.json({inventory:await fetchRealInventory(towerIds),towers:towers.map(({id,name,code,sector})=>({id,name,code,sector}))});}catch{return Response.json({error:"No se pudo cargar el inventario."},{status:502});}}
