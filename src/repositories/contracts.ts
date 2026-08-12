import type { Tower, TowerInput } from "@/features/towers/types";
import type { AppUser, UserInput } from "@/features/users/types";
import type { Visit, VisitInput } from "@/features/visits/types";
import type { Incident, NewIncidentInput } from "@/features/incidents/types";
import type { MaterialRequest, TowerInventory } from "@/features/inventory/types";
import type { ChecklistTemplateAggregate } from "@/domain/checklists";
import type { CatalogItem, CatalogType } from "@/domain/catalogs";

export interface CrudRepository<Entity, Input> { getAll(): Promise<Entity[]>; getById(id: string): Promise<Entity | null>; create(input: Input): Promise<Entity>; update(id: string, input: Input): Promise<Entity>; }
export type TowerRepository = CrudRepository<Tower, TowerInput>;
export type UserRepository = CrudRepository<AppUser, UserInput>;
export type VisitRepository = CrudRepository<Visit, VisitInput>;
export interface IncidentRepository { getAll(): Promise<Incident[]>; getById(id: string): Promise<Incident|null>; create(input: NewIncidentInput): Promise<Incident>; }
export interface InventoryRepository { getAll(): Promise<TowerInventory[]>; getByTower(towerId: string): Promise<TowerInventory[]>; getRequests(): Promise<MaterialRequest[]>; }
export interface ChecklistRepository { getAll(): Promise<ChecklistTemplateAggregate[]>; getById(id: string): Promise<ChecklistTemplateAggregate|null>; }
export interface CatalogRepository { getAll(type?: CatalogType): Promise<CatalogItem[]>; }
