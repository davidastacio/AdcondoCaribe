import type { InventoryStatus, MaterialRequestStatus } from "@/features/inventory/types";
const inventoryStatusLabels:Record<InventoryStatus,string>={AVAILABLE:"Existente",LOW_STOCK:"Bajo stock",OUT_OF_STOCK:"Agotado",NOT_VERIFIED:"Sin verificar"};
export const requestStatusLabels:Record<MaterialRequestStatus,string>={DRAFT:"Borrador",SUBMITTED:"Enviada",UNDER_REVIEW:"En revisión",APPROVED:"Aprobada",REJECTED:"Rechazada",PURCHASED:"Comprada",DELIVERED:"Entregada"};
export function InventoryStatusBadge({status}:{status:InventoryStatus}){return <span className={`stock-badge stock-badge--${status.toLowerCase()}`}><i/>{inventoryStatusLabels[status]}</span>}
export function MaterialRequestStatusBadge({status}:{status:MaterialRequestStatus}){return <span className={`request-badge request-badge--${status.toLowerCase()}`}><i/>{requestStatusLabels[status]}</span>}
