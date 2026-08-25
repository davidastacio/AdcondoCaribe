export type CatalogType = "VISIT_TYPE" | "INCIDENT_AREA" | "INCIDENT_CATEGORY" | "PRIORITY" | "INVENTORY_CATEGORY" | "UNIT" | "DOCUMENT_CATEGORY";
export interface CatalogItem { id: string; type: CatalogType; code: string; label: string; active: boolean; order: number }
