export type CatalogType = "VISIT_TYPE" | "AREA" | "INCIDENT_CATEGORY" | "PRIORITY" | "INVENTORY_CATEGORY" | "UNIT" | "DOCUMENT_CATEGORY";
export interface CatalogItem { id: string; type: CatalogType; code: string; label: string; active: boolean; order: number }
