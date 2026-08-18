import { getServerSessionUser } from "@/lib/auth/server-session";
import { fetchRealIncidents } from "@/lib/incidents/server";
export const runtime="nodejs";type Context={params:Promise<{incidentId:string}>};
export async function GET(_:Request,{params}:Context){const user=await getServerSessionUser();if(!user)return Response.json({error:"No autorizado."},{status:403});const {incidentId}=await params;const incident=(await fetchRealIncidents(user.role==="ADMIN"?undefined:user.id)).find(item=>item.id===incidentId);return incident?Response.json({incident}):Response.json({error:"Incidencia no encontrada."},{status:404})}
