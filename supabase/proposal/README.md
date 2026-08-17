# Migraciones Supabase de ADCONDO

Estas migraciones fueron revisadas y aplicadas en orden al proyecto ADCONDO `cjnymbfojaouelpyxdwu`. Las migraciones `001`–`006` se aplicaron el 12 de agosto de 2026 y `007`–`008` el 16 de agosto de 2026. No deben volver a ejecutarse manualmente; Supabase conserva el historial aplicado.

Orden:

1. `001_foundation.sql`: extensiones, enums, esquema auxiliar y timestamps.
2. `002_identity_catalogs.sql`: usuarios, catálogos, configuración y helpers de identidad.
3. `003_towers_checklists.sql`: torres, asignaciones y plantillas.
4. `004_operations.sql`: visitas, inspecciones e incidencias.
5. `005_inventory_documents_audit.sql`: inventario, solicitudes, documentos, notificaciones y auditoría.
6. `006_rls.sql`: RLS y políticas de tablas.
7. `007_storage.sql`: cinco buckets privados con límites y MIME aprobados; sin carga directa desde navegador.
8. `008_seed_minimum.sql`: catálogos mínimos, sin usuarios ni datos operativos.

Estado remoto verificado: 28 tablas con RLS activo/forzado, cinco buckets privados, catálogos mínimos y cero alertas del asesor de seguridad. La aplicación todavía no está conectada y no existe ningún usuario ADCONDO real.
