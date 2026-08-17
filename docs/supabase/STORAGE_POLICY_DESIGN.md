# Diseño canónico de Supabase Storage

Estado: propuesta no aplicada.

## Buckets privados

| Bucket | Límite propuesto | MIME | Ruta canónica |
|---|---:|---|---|
| `inspection-photos` | 10 MiB | JPEG/PNG/WebP | `{towerId}/{inspectionId}/{uuid}.{ext}` |
| `incident-photos` | 10 MiB | JPEG/PNG/WebP | `{towerId}/{incidentId}/{uuid}.{ext}` |
| `inventory-photos` | 10 MiB | JPEG/PNG/WebP | `{towerId}/{towerInventoryId}/{uuid}.{ext}` |
| `documents` | 25 MiB | PDF/JPEG/PNG | `{towerId|global}/{documentId}/{uuid}.{ext}` |
| `avatars` | 5 MiB | JPEG/PNG/WebP | `{userId}/{uuid}.{ext}` |

## Política inicial

- Ningún bucket es público.
- Mientras Firebase no sea reconocido de forma verificable por el gateway de Storage, no habrá políticas de carga directa desde navegador.
- El backend verifica el ID token Firebase, usuario activo, rol, asignación, path, MIME, extensión y tamaño antes de usar credenciales server-only.
- La fila de metadatos se crea primero con una clave reservada; una carga fallida queda recuperable por conciliación.
- Las descargas usan URLs firmadas cortas (objetivo: 5 minutos); nunca se persiste la URL.
- El supervisor puede cargar/leer solo evidencia asociada a sus torres/visitas; ADMIN administra.
- Avatares: escritura propia o ADMIN; lectura autenticada mediante URL firmada.
- No se permite overwrite. Reemplazar crea un UUID nuevo y marca el anterior eliminado.
- No habrá eliminación física automática durante el MVP.
- Toda imagen se decodifica y vuelve a codificar en el backend antes de subirla; así se elimina EXIF. Latitud/longitud solo se aceptan como campos separados y validados.
- Documentos globales (`tower_id IS NULL`) son exclusivamente ADMIN. El supervisor solo ve documentos de torres asignadas.
- DOCX/XLSX permanecen rechazados hasta implementar análisis de contenido y validación adicional.

## Validaciones pendientes de producto

- Definir antivirus/escaneo de documentos.
- Definir retención legal y tratamiento EXIF/geolocalización.
