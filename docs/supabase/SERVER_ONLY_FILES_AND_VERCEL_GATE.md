# Archivos server-only y puerta previa a Vercel

## Pipeline de archivos

1. El backend verifica el Firebase ID token y resuelve usuario activo.
2. Valida autorización sobre torre/entidad antes de leer el cuerpo completo.
3. Aplica límites de bytes y tiempo; calcula hash SHA-256.
4. Detecta el tipo por firma binaria, no solo por nombre o `Content-Type`.
5. JPEG/PNG/WebP se decodifican y re- codifican; se elimina EXIF y se normaliza orientación.
6. PDF se valida por firma/estructura; no se renderiza como HTML. El análisis antivirus queda como requisito antes de ampliar tipos.
7. Se genera UUID y path canónico server-side; el cliente no decide bucket/path final.
8. Se rechaza overwrite; se sube a bucket privado y se registra `storage_key`, MIME real, tamaño y hash.
9. Latitud/longitud se validan por separado (`[-90,90]`, `[-180,180]`) y nunca se extraen de EXIF.
10. Se registra auditoría. Fallos parciales entran a conciliación; no hay borrado físico automático en MVP.
11. Descarga: autorización nueva en cada solicitud y URL firmada de duración objetivo de 5 minutos.

## Pruebas obligatorias antes de conectar Vercel

- Las ocho migraciones aplican desde cero en staging y su historial coincide.
- Backup y restauración se ejecutan exitosamente.
- Todas las pruebas de `SECURITY_AUTHORIZATION_TEST_PLAN.md` pasan.
- Token ausente, falso, expirado, revocado, con emisor/audiencia incorrectos: denegado.
- Firebase válido sin usuario ADCONDO activo: denegado.
- `SET ROLE adcondo_server` es imposible desde navegador/anon/authenticated.
- Supervisor asignado y no asignado producen resultados opuestos correctos en cada tabla.
- Intentos de cambiar IDs, responsables, `firebase_uid`, rol, estado o actor fallan.
- RPCs rechazan transiciones inválidas, son atómicas e idempotentes donde corresponda.
- Concurrencia: doble inicio/finalización/aprobación no duplica inspecciones ni historiales.
- Todas las tablas públicas tienen RLS forzado y ninguna política inesperada.
- No existe `DELETE` operativo ni eliminación física automática.
- Buckets son privados; MIME/tamaño/path/overwrite y URL expirada se prueban.
- EXIF desaparece tras reprocesamiento; coordenadas separadas conservan validación.
- DOCX/XLSX son rechazados.
- Documentos globales son invisibles para SUPERVISOR.
- Logs no contienen tokens, claves, contraseñas ni contenido privado.
- Asesores Supabase sin hallazgos críticos/altos.
- Secretos de Firebase, DB y Supabase están definidos solo en servidor, rotables y fuera del bundle cliente.
- E2E críticos y rollback de despliegue pasan en staging.

Solo después de esta puerta se documentarán y cargarán variables server-only en Vercel mediante un procedimiento separado y aprobado.

