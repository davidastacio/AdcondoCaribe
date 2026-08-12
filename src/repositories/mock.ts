"use client";
import type { CatalogRepository, ChecklistRepository, IncidentRepository, InventoryRepository, TowerRepository, UserRepository, VisitRepository } from "./contracts";
import { createTower, listTowers, updateTower } from "@/features/towers/service";
import { createUser, listUsers, updateUser } from "@/features/users/service";
import { createVisit, listVisits, updateVisit } from "@/features/visits/service";
import { createIncident, listIncidents } from "@/features/incidents/service";
import { inventoryByTower, listInventory, listRequests } from "@/features/inventory/service";
import { listChecklistTemplates } from "@/features/checklists/service";
import { listCatalogItems } from "@/features/catalogs/service";

export const mockTowerRepository: TowerRepository = { getAll: async()=>listTowers(), getById:async id=>listTowers().find(x=>x.id===id)??null, create:async input=>createTower(input), update:async(id,input)=>updateTower(id,input) };
export const mockUserRepository: UserRepository = { getAll:async()=>listUsers(), getById:async id=>listUsers().find(x=>x.id===id)??null, create:async input=>createUser(input), update:async(id,input)=>updateUser(id,input) };
export const mockVisitRepository: VisitRepository = { getAll:async()=>listVisits(), getById:async id=>listVisits().find(x=>x.id===id)??null, create:async input=>createVisit(input), update:async(id,input)=>updateVisit(id,input) };
export const mockIncidentRepository: IncidentRepository = { getAll:async()=>listIncidents(), getById:async id=>listIncidents().find(x=>x.id===id)??null, create:async input=>createIncident(input) };
export const mockInventoryRepository: InventoryRepository = { getAll:async()=>listInventory(), getByTower:async id=>inventoryByTower(id), getRequests:async()=>listRequests() };
export const mockChecklistRepository: ChecklistRepository = { getAll:async()=>listChecklistTemplates(), getById:async id=>listChecklistTemplates().find(x=>x.id===id)??null };
export const mockCatalogRepository: CatalogRepository = { getAll:async type=>listCatalogItems(type) };
