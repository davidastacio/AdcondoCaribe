# Matriz canónica de permisos RLS

Estado: propuesta no aplicada. `service_role` nunca se entrega al navegador. Todas las mutaciones sensibles pasan por funciones/transacciones server-only que validan transiciones y escriben auditoría.

Leyenda: `R` leer, `C` crear, `U` actualizar, `A` administrar. Sin marca = denegado.

| Recurso | ADMIN | SUPERVISOR | Restricción del supervisor |
|---|---:|---:|---|
| `users` | A | R/U | Solo su fila; U limitado por grants a teléfono/avatar |
| `catalog_items` | A | R | Solo activos |
| `system_settings` | A | — | Nunca cliente supervisor |
| `towers` | A | R | Solo asignación activa |
| `tower_contacts`, `tower_photos` | A | R | Torres asignadas; fotos no eliminadas |
| `tower_assignments` | A | R | Solo asignaciones propias |
| plantillas/secciones/ítems | A | R | Solo plantillas activas; sin edición |
| recurrencias | A | R | Solo propias; no materializa desde cliente |
| `visits` | A | R/U | Propias; U solo inicio/progreso/finalización autorizados |
| historial de agenda | A | R | Visitas propias; append por backend/admin |
| inspecciones/respuestas/fotos | A | C/R/U | Solo visita propia en torre asignada; no borrar evidencia |
| incidencias | A | C/R/U | Torre asignada; transiciones limitadas |
| actualizaciones/fotos de incidencia | A | C/R | Sin notas internas; actor debe ser usuario actual |
| ítems de inventario | A | R | Solo activos |
| inventario de torre | A | R/U | Torre asignada; no crear catálogo |
| fotos de inventario | A | C/R | Torre asignada; carga propia |
| solicitudes | A | C/R/U | Propias; borrador → enviada |
| ítems de solicitud | A | C/R/U | Solo mientras solicitud propia esté en borrador |
| historial de solicitud | A | R | Solicitudes propias; append por backend |
| documentos | A | R | Documentos activos de torres asignadas |
| notificaciones | A | R/U | Propias; U limitado a `read_at` |
| `activity_logs` | R | — | Escritura solo por mecanismo privilegiado |

## Transiciones obligatorias

- Visita: ADMIN programa/reprograma/cancela; supervisor asignado puede `SCHEDULED → IN_PROGRESS → COMPLETED`.
- Incidencia: supervisor crea `OPEN`, comenta, marca trabajo realizado y solicita verificación; ADMIN asigna, resuelve, devuelve corrección y cierra.
- Solicitud: supervisor `DRAFT → SUBMITTED`; ADMIN `SUBMITTED → UNDER_REVIEW → APPROVED|REJECTED → PURCHASED → DELIVERED`.
- Asignación: solo ADMIN crea, suspende o finaliza.
- Plantillas/catalogación/configuración: solo ADMIN.

Estas transiciones se implementan en la propuesta mediante RPCs server-only (`start_visit`, `finish_visit`, `transition_incident`, `transition_material_request`). Los grants omiten columnas protegidas y un trigger adicional impide que un usuario cambie campos de seguridad de `users`. Los RPCs bloquean la fila, derivan el actor de la sesión y escriben historial/auditoría dentro de la misma transacción.

No se concede `DELETE` al rol de aplicación. ADMIN utiliza baja lógica para datos históricos.

## Casos que siempre deben fallar

- Anónimo o usuario Firebase sin fila activa.
- Usuario `PENDING`, `INACTIVE` o `SUSPENDED`.
- Supervisor consultando otra torre o alterando `supervisor_id`/`tower_id`.
- Cliente asignándose rol, enlazando otro `firebase_uid` o cambiando estado.
- Supervisor leyendo `is_internal = true`.
- Escritura directa en `activity_logs` o historiales append-only.
- Uso de una URL firmada expirada o path cuyo UUID no pertenece al contexto autorizado.
