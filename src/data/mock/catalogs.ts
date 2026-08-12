import type { CatalogItem } from "@/domain/catalogs";
const group = (type: CatalogItem["type"], values: string[]): CatalogItem[] => values.map((label, order) => ({ id: `${type.toLowerCase()}-${order + 1}`, type, code: label.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W+/g, "_"), label, active: true, order }));
export const seedCatalogItems: CatalogItem[] = [
  ...group("VISIT_TYPE", ["Supervisión general", "Seguimiento", "Emergencia", "Entrega de materiales"]),
  ...group("AREA", ["Lobby", "Parqueos", "Ascensores", "Piscina", "Gimnasio", "Planta eléctrica", "Bombas", "Jardinería", "Fachada"]),
  ...group("INCIDENT_CATEGORY", ["Equipos", "Electricidad", "Plomería", "Limpieza", "Mantenimiento físico", "Seguridad"]),
  ...group("PRIORITY", ["Baja", "Media", "Alta", "Crítica"]),
  ...group("INVENTORY_CATEGORY", ["Limpieza", "Higiene", "Piscina", "Electricidad", "Mantenimiento", "Otros"]),
  ...group("UNIT", ["Unidad", "Botella", "Rollo", "Paquete", "Caja", "Galón", "Litro"]),
  ...group("DOCUMENT_CATEGORY", ["Reglamentos", "Manuales", "Certificaciones", "Contratos", "Reportes"]),
];
