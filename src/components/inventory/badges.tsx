import { inventoryStatusLabels, requestStatusLabels } from "@/features/inventory/service";
import type { InventoryStatus, MaterialRequestStatus } from "@/features/inventory/types";
export function InventoryStatusBadge({status}:{status:InventoryStatus}){return <span className={`stock-badge stock-badge--${status.toLowerCase()}`}><i/>{inventoryStatusLabels[status]}</span>}
export function MaterialRequestStatusBadge({status}:{status:MaterialRequestStatus}){return <span className={`request-badge request-badge--${status.toLowerCase()}`}><i/>{requestStatusLabels[status]}</span>}
