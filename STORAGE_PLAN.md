# Plan de almacenamiento Supabase Storage

No se suben archivos reales en esta fase. La UI mantendrá `storageKey`/URL como referencias y utilizará un futuro `StorageRepository`.

## Buckets

| Bucket | Contenido | Acceso previsto |
|---|---|---|
| `inspection-photos` | Evidencias de respuestas | supervisor asignado y ADMIN |
| `incident-photos` | Antes, después y generales | participantes autorizados y ADMIN |
| `inventory-photos` | Existencias y ubicaciones | supervisor asignado y ADMIN |
| `documents` | Reglamentos, manuales, contratos | privado; URLs firmadas |
| `avatars` | Perfiles de usuarios | lectura autenticada; escritura propia/ADMIN |

## Interfaz prevista

`StorageRepository` tendrá `upload(file, context)`, `remove(storageKey)`, `getSignedUrl(storageKey)` y `validate(file)`. La implementación mock conservará previsualizaciones locales; `SupabaseStorageRepository` manejará buckets sin modificar componentes.

## Convención y seguridad

- Ruta: `{towerId}/{entityId}/{uuid}.{ext}`; avatares: `{userId}/{uuid}.{ext}`.
- Guardar `storage_key`, nunca una URL firmada temporal, en PostgreSQL.
- Validar MIME, tamaño y extensión; eliminar metadatos sensibles cuando corresponda.
- Políticas RLS/Storage equivalentes a asignaciones y roles.
- Borrado lógico de registros históricos; eliminación física mediante proceso administrativo auditado.
