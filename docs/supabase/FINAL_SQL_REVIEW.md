# Revisión final de los ocho SQL propuestos

Fecha de revisión: 2026-08-12. Estado actualizado el 2026-08-16: las ocho migraciones fueron aplicadas correctamente al proyecto ADCONDO `cjnymbfojaouelpyxdwu` y verificadas mediante MCP.

| Archivo | Alcance | Revisión | Condición de ejecución |
|---|---|---|---|
| `001_foundation.sql` | Extensión, esquema, enums, timestamp | Coherente con UUID/MVP | Ejecutar primero en staging vacío |
| `002_identity_catalogs.sql` | Usuarios, catálogos, helpers | Sin credenciales; Firebase UID único | Confirmar propietario seguro de funciones |
| `003_towers_checklists.sql` | Torres, asignaciones, checklist | Índice activo y supervisor validado | Probar trigger con usuario no supervisor |
| `004_operations.sql` | Visitas, inspecciones, incidencias | Una inspección/visita, snapshots | Probar catálogo y snapshot con fixtures |
| `005_inventory_documents_audit.sql` | Inventario, solicitudes, documentos, logs | Sin `purchase_requests`; append-only por permisos | Probar precisiones y trazabilidad |
| `006_rls.sql` | Identidad transaccional, RPCs, RLS/grants | RPCs y columnas protegidas añadidos | Requiere prueba real de roles/owner/RLS en staging |
| `007_storage.sql` | Cinco buckets privados | Límites aprobados; solo PDF/JPEG/PNG en documentos | Requiere backend de procesamiento antes de uso |
| `008_seed_minimum.sql` | Catálogos mínimos | Idempotente; sin usuarios/operación | Validar catálogo definitivo con producto |

## Hallazgos cerrados

- DOCX/XLSX retirados.
- No hay políticas públicas de `storage.objects`.
- El supervisor no recibe UPDATE genérico para estados de visitas, incidencias o solicitudes.
- Actor, timestamps protegidos, responsables y estados se derivan/validan en RPCs.
- `activity_logs` no tiene grant de escritura directa.
- El rol `adcondo_server` es `NOLOGIN`, `NOINHERIT`, `NOBYPASSRLS` y no se concede a `anon`/`authenticated`.
- `begin_verified_request` solo funciona después de `SET LOCAL ROLE adcondo_server` y usa configuración local a la transacción.

## Observaciones que requieren staging

Una revisión estática no demuestra que Supabase permita exactamente la creación/propiedad del rol en su entorno administrado ni que todas las firmas se resuelvan igual que en PostgreSQL local. Antes de producción se debe:

1. Ejecutar las migraciones en una rama/staging vacía.
2. Confirmar propietario y `search_path` de cada función `SECURITY DEFINER`.
3. Confirmar que el usuario de conexión del backend puede hacer `SET LOCAL ROLE adcondo_server`, sin conceder esa capacidad a ningún cliente.
4. Ejecutar pruebas de RLS con `FORCE ROW LEVEL SECURITY`.
5. Revisar con asesores de seguridad/rendimiento.

Conclusión actualizada: los ocho archivos están aplicados. Supabase reporta 28 tablas con RLS activo/forzado, cinco buckets privados y cero alertas de seguridad. Permanecen pendientes las pruebas de autorización con identidades reales, el bootstrap del primer ADMIN, la integración Firebase/backend y las optimizaciones de rendimiento basadas en consultas reales.
