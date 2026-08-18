import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch } from "@/lib/database/verified-request";
import { fetchRealTowers } from "@/lib/towers/server";
export const runtime="nodejs";
export async function GET(){
  const user=await getServerSessionUser();if(!user)return Response.json({error:"No autorizado."},{status:403});
  const [catalogResponse,userResponse,assignmentResponse]=await Promise.all([
    supabaseServerFetch("catalog_items?select=id,catalog_type,code,label&catalog_type=in.(INCIDENT_AREA,INCIDENT_CATEGORY)&active=eq.true&order=sort_order.asc"),
    supabaseServerFetch("users?select=id,first_name,last_name,job_title,role&role=in.(SUPERVISOR,INCIDENT_SUPERVISOR)&status=eq.ACTIVE"),
    supabaseServerFetch("tower_assignments?select=tower_id,supervisor_id&status=eq.ACTIVE"),
  ]);
  if(![catalogResponse,userResponse,assignmentResponse].every(response=>response.ok))return Response.json({error:"No se pudieron cargar las opciones."},{status:502});
  const assignments=await assignmentResponse.json() as {tower_id:string;supervisor_id:string}[];
  const towers=(await fetchRealTowers()).filter(tower=>user.role==="ADMIN"||assignments.some(item=>item.tower_id===tower.id&&item.supervisor_id===user.id));
  return Response.json({towers,catalogs:await catalogResponse.json(),assignees:await userResponse.json()});
}
