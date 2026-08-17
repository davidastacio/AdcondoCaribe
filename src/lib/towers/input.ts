import { z } from "zod";

const contactSchema = z.object({ id: z.string().optional(), type: z.string().trim().min(2).max(80), name: z.string().trim().min(2).max(120), phone: z.string().trim().max(40).optional(), email: z.union([z.string().trim().email(), z.literal("")]).optional(), notes: z.string().trim().max(500).optional() });
export const towerInputSchema = z.object({
  code: z.string().trim().max(30).optional(), name: z.string().trim().min(2).max(150), type: z.enum(["TOWER", "CONDOMINIUM", "RESIDENTIAL"]),
  address: z.string().trim().min(5).max(300), sector: z.string().trim().min(2).max(120), city: z.string().trim().min(2).max(120), province: z.string().trim().max(120),
  locationReference: z.string().trim().max(300).optional(), floors: z.number().int().min(0).max(300).optional(), apartments: z.number().int().min(0).max(5000).optional(),
  parkingSpaces: z.number().int().min(0).max(10000).optional(), elevators: z.number().int().min(0).max(100).optional(), yearBuilt: z.number().int().min(1800).max(2200).optional(), blocks: z.number().int().min(0).max(100).optional(),
  hasPool: z.boolean(), hasGym: z.boolean(), hasSocialArea: z.boolean(), hasGenerator: z.boolean(), hasElevators: z.boolean(), hasCameras: z.boolean(), hasWaterTank: z.boolean(), hasPumps: z.boolean(),
  status: z.enum(["ACTIVE", "OBSERVATION", "MAINTENANCE", "INACTIVE"]), notes: z.string().trim().max(2000).optional(), contacts: z.array(contactSchema).max(20),
});

export const towerPayload = (input: z.infer<typeof towerInputSchema>, actor: { id: string }, code: string) => ({
  code, name: input.name, type: input.type, address: input.address, sector: input.sector, city: input.city, province: input.province || null,
  location_reference: input.locationReference || null, floors: input.floors ?? null, apartments: input.apartments ?? null, parking_spaces: input.parkingSpaces ?? null,
  elevators: input.elevators ?? null, year_built: input.yearBuilt ?? null, blocks: input.blocks ?? null, has_pool: input.hasPool, has_gym: input.hasGym,
  has_social_area: input.hasSocialArea, has_generator: input.hasGenerator, has_elevators: input.hasElevators, has_cameras: input.hasCameras,
  has_water_tank: input.hasWaterTank, has_pumps: input.hasPumps, status: input.status, notes: input.notes || null, created_by_id: actor.id, updated_by_id: actor.id,
});
