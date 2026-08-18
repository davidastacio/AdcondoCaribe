import { getServerSessionUser } from "@/lib/auth/server-session";
import { fetchRealIncidents } from "@/lib/incidents/server";
export const runtime="nodejs";type Context={params:Promise<{incidentId:string}>};
export async function GET(_:Request,{params}:Context){
  const user=await getServerSessionUser();if(!user)return Response.json({error:"No autorizado."},{status:403});
  const {incidentId}=await params;const incident=(await fetchRealIncidents(user.role==="ADMIN"?undefined:user.id)).find(item=>item.id===incidentId);
  if(!incident)return Response.json({error:"Incidencia no encontrada."},{status:404});
  const admin=user.role==="ADMIN",reporter=incident.reportedById===user.id,assignee=incident.assignedToId===user.id;
  return Response.json({incident,currentUser:{id:user.id,role:user.role},capabilities:{
    canAssign:admin&&["OPEN","ASSIGNED"].includes(incident.status),canChangePriority:admin&&incident.status!=="CLOSED",
    canComment:incident.status!=="CLOSED",canInternalNote:admin&&incident.status!=="CLOSED",
    canStart:(admin||assignee)&&["OPEN","ASSIGNED"].includes(incident.status),
    canComplete:(admin||assignee)&&incident.status==="IN_PROGRESS",
    canVerify:(admin||reporter)&&incident.status==="PENDING_VERIFICATION",
    canClose:admin&&incident.status==="RESOLVED"
  }});
}
