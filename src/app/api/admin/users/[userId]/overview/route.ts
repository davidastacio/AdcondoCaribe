import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseServerFetch, type DatabaseUserRow } from "@/lib/database/verified-request";
import { fetchRealIncidents } from "@/lib/incidents/server";
import { fetchRealActivity } from "@/lib/reports/server";
import { serializeDatabaseUser, userSelect } from "@/lib/users/server";
import { fetchRealVisits } from "@/lib/visits/server";

export const runtime="nodejs";type Context={params:Promise<{userId:string}>};
export async function GET(_:Request,{params}:Context){if(!(await requireAdmin()))return Response.json({error:"No autorizado."},{status:403});try{const {userId}=await params,[userResponse,assignmentResponse,visits,incidents,activity]=await Promise.all([supabaseServerFetch(`users?select=${userSelect}&id=eq.${encodeURIComponent(userId)}&limit=1`),supabaseServerFetch(`tower_assignments?select=id&supervisor_id=eq.${encodeURIComponent(userId)}&status=eq.ACTIVE`),fetchRealVisits(userId),fetchRealIncidents(userId),fetchRealActivity()]),[user]=userResponse.ok?await userResponse.json() as DatabaseUserRow[]:[];if(!user)return Response.json({error:"Usuario no encontrado."},{status:404});if(!assignmentResponse.ok)throw new Error("No se consultaron las asignaciones.");return Response.json({user:serializeDatabaseUser(user),activeAssignments:(await assignmentResponse.json() as unknown[]).length,visits,incidents:incidents.filter((incident)=>incident.reportedById===userId),activity:activity.filter((item)=>item.userId===userId).slice(0,10)});}catch{return Response.json({error:"No se pudo cargar el expediente del usuario."},{status:502});}}
