import type { Tower, TowerContact, TowerStatus, TowerType } from "@/features/towers/types";
import { supabaseServerFetch } from "@/lib/database/verified-request";

export type DatabaseTowerRow = {
  id: string; code: string; name: string; type: TowerType; address: string; sector: string | null;
  city: string | null; province: string | null; location_reference: string | null; floors: number | null;
  apartments: number | null; parking_spaces: number | null; elevators: number | null; year_built: number | null;
  blocks: number | null; has_pool: boolean; has_gym: boolean; has_social_area: boolean; has_generator: boolean;
  has_elevators: boolean; has_cameras: boolean; has_water_tank: boolean; has_pumps: boolean; status: TowerStatus;
  notes: string | null; created_at: string; updated_at: string;
};

type DatabaseContactRow = { id: string; tower_id: string; type: string; name: string; phone: string | null; email: string | null; notes: string | null; active: boolean };
type DatabaseAssignmentRow = { tower_id: string; supervisor_id: string; status: string };
type DatabaseSupervisorRow = { id: string; first_name: string; last_name: string };

export const towerSelect = "id,code,name,type,address,sector,city,province,location_reference,floors,apartments,parking_spaces,elevators,year_built,blocks,has_pool,has_gym,has_social_area,has_generator,has_elevators,has_cameras,has_water_tank,has_pumps,status,notes,created_at,updated_at";

const serializeContact = (row: DatabaseContactRow): TowerContact => ({
  id: row.id, type: row.type, name: row.name, phone: row.phone ?? "", email: row.email ?? "", notes: row.notes ?? undefined,
});

export function serializeTower(row: DatabaseTowerRow, contacts: DatabaseContactRow[] = [], supervisors: string[] = []): Tower {
  return {
    id: row.id, code: row.code, name: row.name, type: row.type, address: row.address, sector: row.sector ?? "",
    city: row.city ?? "", province: row.province ?? "", locationReference: row.location_reference ?? undefined,
    floors: row.floors ?? undefined, apartments: row.apartments ?? undefined, parkingSpaces: row.parking_spaces ?? undefined,
    elevators: row.elevators ?? undefined, yearBuilt: row.year_built ?? undefined, blocks: row.blocks ?? undefined,
    hasPool: row.has_pool, hasGym: row.has_gym, hasSocialArea: row.has_social_area, hasGenerator: row.has_generator,
    hasElevators: row.has_elevators, hasCameras: row.has_cameras, hasWaterTank: row.has_water_tank, hasPumps: row.has_pumps,
    status: row.status, notes: row.notes ?? undefined, contacts: contacts.filter((item) => item.tower_id === row.id && item.active).map(serializeContact),
    supervisors, documents: [], photos: [], activity: [], createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function fetchRealTowers() {
  const [towerResponse, contactResponse, assignmentResponse, supervisorResponse] = await Promise.all([
    supabaseServerFetch(`towers?select=${towerSelect}&order=name.asc`),
    supabaseServerFetch("tower_contacts?select=id,tower_id,type,name,phone,email,notes,active"),
    supabaseServerFetch("tower_assignments?select=tower_id,supervisor_id,status&status=eq.ACTIVE"),
    supabaseServerFetch("users?select=id,first_name,last_name&role=in.(SUPERVISOR,INCIDENT_SUPERVISOR)&status=eq.ACTIVE"),
  ]);
  if (![towerResponse, contactResponse, assignmentResponse, supervisorResponse].every((response) => response.ok)) {
    throw new Error("Supabase no pudo consultar las torres.");
  }
  const towers = (await towerResponse.json()) as DatabaseTowerRow[];
  const contacts = (await contactResponse.json()) as DatabaseContactRow[];
  const assignments = (await assignmentResponse.json()) as DatabaseAssignmentRow[];
  const users = (await supervisorResponse.json()) as DatabaseSupervisorRow[];
  const names = new Map(users.map((user) => [user.id, `${user.first_name} ${user.last_name}`]));
  return towers.map((tower) => serializeTower(tower, contacts, assignments.filter((item) => item.tower_id === tower.id).map((item) => names.get(item.supervisor_id)).filter((name): name is string => Boolean(name))));
}
