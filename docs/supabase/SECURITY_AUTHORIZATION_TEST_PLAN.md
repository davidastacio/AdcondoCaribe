# Plan de pruebas de seguridad y autorización

## Preparación

- Ejecutar exclusivamente en una rama/staging aislada.
- Crear fixtures: ADMIN activo, supervisor A asignado, supervisor B no asignado, usuario pendiente, inactivo y suspendido.
- Usar dos torres, visitas, inspecciones, incidencias y solicitudes separadas.
- Verificar que cada prueba usa un token distinto y que no reutiliza sesión privilegiada.

## Pruebas de identidad

1. Token ausente, expirado, audiencia/emisor incorrectos y token manipulado: 401.
2. Firebase válido sin `public.users`: 403.
3. Usuarios no activos: 403.
4. Cambio de rol/email/UID enviado por cliente: ignorado o denegado.
5. Revocación Firebase y rotación: sesión deja de operar según SLA acordado.

## RLS horizontal y vertical

- Ejecutar por cada tabla todos los `SELECT/INSERT/UPDATE/DELETE` con los seis actores.
- Supervisor A no ve ni muta recursos de torre B.
- Cambiar FK en payload para secuestrar recurso falla por `WITH CHECK`.
- Supervisor no edita rol, estado, UID, asignación, catálogo o configuración.
- Campos protegidos de flujos no cambian mediante update genérico.
- Historiales y auditoría no permiten alteración ni borrado.

## Estados y concurrencia

- Probar todas las transiciones válidas e inválidas de visitas, incidencias y solicitudes.
- Dos aprobaciones concurrentes no duplican historial ni compra.
- Dos asignaciones activas equivalentes violan índice único.
- Una visita tiene como máximo una inspección.
- Materialización de recurrencias es idempotente.

## Storage

- Bucket/path ajeno, MIME disfrazado, extensión doble, archivo sobredimensionado y path traversal fallan.
- URL firmada expira y no amplía acceso a otros objetos.
- Supervisor retirado pierde acceso nuevo sin alterar evidencia histórica.
- Borrado lógico no elimina físicamente antes del proceso autorizado.

## Auditoría y asesores

- Toda mutación sensible genera exactamente un evento con actor y entidad correctos.
- Metadatos no contienen tokens ni secretos.
- Ejecutar asesores Supabase de seguridad/rendimiento y resolver hallazgos críticos.
- Revisar índices con planes de consulta representativos y carga paginada.

## Criterio de salida

Cero bypass de rol/asignación, cero tabla pública sin RLS, cero política permisiva no justificada, cero secreto en cliente/log y cobertura automatizada de toda la matriz.

