// Único punto de composición. En producción estos adaptadores se sustituyen por implementaciones Supabase.
export { mockTowerRepository as towers, mockUserRepository as users, mockVisitRepository as visits, mockIncidentRepository as incidents, mockInventoryRepository as inventory, mockChecklistRepository as checklists, mockCatalogRepository as catalogs } from "./mock";
export type * from "./contracts";
