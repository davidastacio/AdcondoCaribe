# Plan de integración progresiva

## Fase 0 — aprobación y staging

- Aprobar especificación, SQL, límites Storage y puente Firebase/RLS.
- Crear rama/staging y backup; definir rollback por migración.
- No tocar producción ni importar mocks.

## Fase 1 — base e identidad server-only

- Aplicar 001–003 en staging.
- Integrar Firebase Admin en servidor y reemplazar sesión mock gradualmente.
- Enlazar usuarios internos explícitamente; ningún alta automática.
- Probar claims de transacción y funciones RLS.

## Fase 2 — lectura paralela

- Implementar adaptadores Supabase detrás de contratos existentes.
- Migrar primero catálogos, usuarios, torres y asignaciones.
- Comparar resultados local/Supabase sin retirar todavía el repositorio local.
- Eliminar fallbacks al primer registro y devolver 404 real.

## Fase 3 — operaciones por dominio

1. Checklists y visitas.
2. Inspecciones y fotos.
3. Incidencias.
4. Inventario y solicitudes.
5. Documentos, notificaciones y reportes.

Cada dominio pasa por: importación normalizada, lectura real, escritura server-only, pruebas, observación y retirada de su fuente local duplicada.

## Fase 4 — Storage

- Crear buckets solo tras aprobar política y límites.
- Mantener cargas en backend hasta validar integración Firebase directa.
- Migrar referencias locales a `storage_key`; verificar huellas y metadatos.

## Fase 5 — endurecimiento

- Activar RLS antes de exponer cualquier tabla.
- Ejecutar matriz completa, E2E, asesores, paginación e índices.
- Confirmar auditoría, revocación, backups y restauración.
- Retirar mocks, actores hardcodeados y selector de rol.

## Migración de datos mock

- Exportar a staging, deduplicar torres/usuarios/documentos y validar FK.
- Generar UUID y conservar mapa temporal de IDs legacy.
- No migrar object URLs, datos demo inconsistentes ni contraseñas mock.
- Importar padres antes que hijos y reconciliar conteos/checksums.
- Los seeds de producción solo contienen catálogos indispensables; usuarios y operación se cargan por proceso administrativo/importación auditada.

## Prisma

- Congelar `prisma/schema.prisma` como referencia durante la transición.
- No ejecutar `prisma migrate`.
- Tras estabilizar staging: retirar Prisma o mantenerlo únicamente como cliente introspectado, según medición de complejidad.

