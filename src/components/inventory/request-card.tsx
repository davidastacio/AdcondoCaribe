import type { MaterialRequest } from "@/features/inventory/types";
import { CalendarDays, ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { MaterialRequestStatusBadge } from "./badges";
export function MaterialRequestCard({request,basePath="/admin/solicitudes"}:{request:MaterialRequest;basePath?:string}){return <Link className="material-request-card" href={`${basePath}/${request.id}`}><div><span className="request-code">{request.code}</span><MaterialRequestStatusBadge status={request.status}/></div><h3>{request.towerName}</h3><p><Package/>{request.items.length} productos</p><p><CalendarDays/>{new Date(request.createdAt).toLocaleDateString("es-DO")}</p><ChevronRight/></Link>}
