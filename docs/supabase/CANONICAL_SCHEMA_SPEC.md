# Especificación canónica de Supabase para ADCONDO DEL CARIBE

Estado: **propuesta para revisión; no ejecutada**  
Proyecto objetivo: `cjnymbfojaouelpyxdwu`  
Fecha: 2026-08-12

Esta especificación reemplaza como fuente de verdad de diseño a las diferencias existentes entre `SUPABASE_SCHEMA_PLAN.md` y `prisma/schema.prisma`. Los archivos SQL bajo `supabase/proposal/migrations/` son artefactos de revisión y no deben ejecutarse hasta aprobación expresa.

## 1. Decisiones definitivas

### Identificadores

- Todas las PK de aplicación serán `uuid` con `gen_random_uuid()`.
- Todas las FK de aplicación serán `uuid`.
- Los IDs locales tipo `usr-*`, `tower-*` y los `cuid()` de Prisma no llegarán a producción. Durante importación se mantendrá un mapa `legacy_id -> uuid` fuera del modelo final.
- Los códigos visibles (`TOR-001`, `VIS-...`, `INC-...`, `SOL-...`) son claves de negocio únicas, nunca PK.

### Usuarios, roles y supervisores

- `public.users` será la única entidad de personas internas.
- Cada usuario tendrá exactamente un rol operativo: `ADMIN` o `SUPERVISOR`.
- No se crearán `roles`, `user_roles` ni `supervisors` en la primera versión.
- Los campos laborales del supervisor (`employee_code`, `job_title`, teléfono) vivirán en `users`; `employee_code` será único cuando exista.
- Si en el futuro se requieren múltiples roles o permisos personalizados, se añadirá RBAC en una migración nueva, no anticipadamente.
- `password_hash` queda eliminado: Firebase Authentication es el único custodio de credenciales.

### Firebase y `public.users`

- Firebase autentica credenciales, recuperación, MFA futura y emite el ID token.
- `public.users.firebase_uid` vincula la identidad Firebase con ADCONDO y es `UNIQUE`.
- Un usuario puede ser creado administrativamente como `PENDING` sin `firebase_uid`; no obtiene acceso hasta enlazarse y quedar `ACTIVE`.
- Correo, rol, estado y asignaciones autorizantes se leen siempre de PostgreSQL. Claims del cliente nunca deciden el rol.
- La cuenta Firebase no crea automáticamente un usuario ADCONDO ni hereda permisos.

### Puente seguro Firebase → RLS

Supabase no debe aceptar un `firebase_uid` enviado en headers o cuerpo como prueba de identidad. La arquitectura aprobable es:

1. El cliente envía su Firebase ID token al backend Next.js.
2. Firebase Admin verifica firma, emisor, audiencia, expiración y revocación cuando aplique.
3. El backend resuelve `public.users.firebase_uid`, exige `status = 'ACTIVE'` y obtiene el UUID interno.
4. Para operaciones normales, el backend abre una transacción PostgreSQL y establece claims de sesión locales y de corta vida (`request.jwt.claim.sub`, `firebase_uid`) a partir del token ya verificado.
5. Las funciones RLS `app.current_user_id()`, `app.is_admin()` y `app.is_supervisor()` vuelven a resolver el usuario en la base; no aceptan rol del cliente.
6. El navegador no recibe `service_role`, contraseña de base de datos ni capacidad de establecer claims.

La alternativa aceptable futura es configurar formalmente Firebase como proveedor externo compatible con Supabase y validar tokens directamente en el gateway. Hasta comprobar esa integración de extremo a extremo, las consultas protegidas serán **server-only**. El acceso directo del navegador a tablas/Storage queda bloqueado.

### Torres y asignaciones

- `tower_assignments.supervisor_id` referencia directamente `users.id` y exige rol `SUPERVISOR` mediante trigger.
- Una torre puede tener varios supervisores activos y un supervisor varias torres.
- Un índice único parcial impide duplicar la misma asignación activa `(tower_id, supervisor_id)`.
- Finalizar una asignación conserva historial mediante `status`, `end_date`, `ended_by_id`.
- Las visitas permanecen ligadas al supervisor histórico aunque su asignación termine.

### Visitas e inspecciones

- Una visita tiene cero o una inspección: `inspections.visit_id UNIQUE`.
- La inspección se crea al iniciar el flujo, no al programar la visita.
- La inspección conserva `template_id`, `template_version` y un `template_snapshot jsonb`; así una plantilla futura no altera evidencia histórica.
- Una respuesta es única por `(inspection_id, item_id)`.
- Recurrencias son reglas; un proceso controlado materializará visitas y será idempotente.

### Estados, prioridades y catálogos

- Estados que gobiernan flujos y RLS se implementan como enums PostgreSQL: rol, usuarios, asignaciones, torres, visitas, inspecciones, condición, prioridad, incidencias, inventario y solicitudes.
- Catálogos administrables se guardan en `catalog_items`: áreas, categorías de incidencias, unidades, categorías de inventario, tipos de visita y categorías de documentos.
- `catalog_items` usa `(catalog_type, code)` único y baja lógica con `active`.
- Una FK o trigger valida que cada referencia apunte al tipo de catálogo esperado.

### Inventario y solicitudes

- `inventory_items` referencia categoría y unidad mediante `catalog_items`.
- `tower_inventory` es único por torre/material, conserva cantidad, recomendado, estado y último verificador.
- `material_requests` representa el flujo completo; `material_request_updates` es el historial inmutable.
- Se elimina `purchase_requests` de la v1: duplica estados de compra ya presentes. Si Compras requiere entidad propia se añadirá luego con órdenes/proveedores/facturas reales.
- Los supervisores crean borradores y envían; ADMIN aprueba, rechaza, marca comprado y entregado.

### Auditoría

- `activity_logs` es append-only y no admite INSERT/UPDATE/DELETE desde clientes.
- Se escribe mediante funciones `SECURITY DEFINER` restringidas o por backend privilegiado, con `actor_user_id`, acción, entidad, torre, metadatos sanitizados, IP y user-agent opcionales.
- Nunca almacena tokens, contraseñas, claves, archivos ni datos secretos.
- Los historiales específicos (`incident_updates`, `material_request_updates`, `visit_schedule_history`) son también append-only.

### Eliminación, tiempo y trazabilidad

- Fechas: `timestamptz`; fechas civiles: `date`; horas programadas: `time`.
- Tablas mutables: `created_at`, `updated_at`, `created_by_id`/`updated_by_id` cuando aporte trazabilidad.
- Entidades maestras se desactivan con `status` o `active`; no se borran si tienen historial.
- Archivos usan `deleted_at`, `deleted_by_id`; el objeto físico se elimina después mediante proceso administrativo auditado.
- Solo hijos puramente compositivos sin uso histórico pueden usar `ON DELETE CASCADE`.

## 2. Modelo canónico

### Identidad y configuración

- `users`
- `catalog_items`
- `system_settings`
- `activity_logs`
- `notifications`

### Torres

- `towers`
- `tower_contacts`
- `tower_photos`
- `tower_assignments`

### Checklists, visitas e inspecciones

- `checklist_templates`
- `checklist_sections`
- `checklist_items`
- `visit_recurrences`
- `visits`
- `visit_schedule_history`
- `inspections`
- `inspection_answers`
- `inspection_photos`

### Incidencias

- `incidents`
- `incident_updates`
- `incident_photos`

### Inventario y materiales

- `inventory_items`
- `tower_inventory`
- `inventory_photos`
- `material_requests`
- `material_request_items`
- `material_request_updates`

### Documentos

- `documents`

`reports` no se materializa inicialmente: los reportes se calculan con consultas/vistas y los archivos exportados, si se conservan, serán `documents` con categoría de reporte.

## 3. Diferencias resueltas frente a Prisma

| Prisma preliminar | Decisión canónica |
|---|---|
| `String @default(cuid())` | `uuid DEFAULT gen_random_uuid()` |
| `Role`, `UserRole` y `User.appRole` simultáneos | Solo `users.role` enum en v1 |
| Tabla `Supervisor` separada | Eliminada; supervisor es `users.role = SUPERVISOR` |
| `passwordHash` | Eliminado; credenciales solo en Firebase |
| `TowerAssignment.supervisorId -> Supervisor` | FK directa a `users.id` |
| `Visit.inspections[]` | `inspections.visit_id UNIQUE` (0..1) |
| Plantilla sin snapshot | `template_version` + `template_snapshot` en inspección |
| Categoría/unidad de inventario como texto | FK a `catalog_items` |
| `PurchaseRequest` | Diferido/eliminado de v1 |
| `Report` persistido | Vistas/consultas; exportación como documento opcional |
| URLs y `storageKey` opcionales mezclados | Solo `storage_key` persistente; URLs firmadas efímeras |
| IDs de actor sin FK | Todas las identidades de actor son FK a `users` |
| Borrados cascada amplios | Baja lógica para entidades con historial |

## 4. Futuro de Prisma

- Supabase/PostgreSQL y sus migraciones SQL serán la fuente de verdad.
- Prisma no generará ni aplicará migraciones contra producción.
- Durante la transición, `schema.prisma` queda como referencia obsoleta hasta decidir si Prisma Client sigue aportando valor.
- Opción preferida: acceso server-only mediante cliente Supabase/Postgres tipado y tipos generados desde la base; retirar Prisma después de migrar repositorios.
- Opción permitida: conservar Prisma únicamente como cliente de consultas, haciendo introspección después de cada migración aprobada y sin `prisma migrate`.
- Nunca habrá dos sistemas de migración activos.

## 5. Criterios de aceptación antes de ejecutar

- Aprobar esta especificación y cada archivo SQL.
- Elegir y probar el puente Firebase → sesión PostgreSQL/RLS.
- Validar transiciones de estados y responsabilidades del ADMIN.
- Probar RLS con usuario anónimo, inactivo, ADMIN, supervisor asignado y no asignado.
- Confirmar límites MIME/tamaño y retención de archivos.
- Preparar backup, entorno de staging y rollback antes de tocar producción.

