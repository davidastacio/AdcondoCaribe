# Plan de esquema Supabase PostgreSQL

Documento de diseño; no existe conexión activa. Convenciones: UUID como PK con `gen_random_uuid()`, `timestamptz` para fechas de auditoría, `created_at`/`updated_at`, claves foráneas indexadas y borrado lógico (`active` o `status`) cuando exista histórico.

## Identidad y edificios

| Tabla | Campos principales | Restricciones e índices |
|---|---|---|
| `users` | `id uuid PK`, `firebase_uid text nullable`, `email text`, `first_name text`, `last_name text`, `phone text nullable`, `avatar_url text nullable`, `job_title text nullable`, `role text`, `status text`, `last_login_at timestamptz nullable`, timestamps | `firebase_uid UNIQUE`, `email UNIQUE`, index `(role,status)` |
| `towers` | `id uuid PK`, `code text`, `name text`, `type text`, dirección/sector/ciudad/provincia nullable, características numéricas y booleanas, `status text`, `notes text nullable`, timestamps | `code UNIQUE`, index `(status,name)` |
| `tower_contacts` | `id uuid PK`, `tower_id uuid FK`, `type`, `name`, `phone/email/notes nullable`, timestamps | index `tower_id`; FK cascade |
| `tower_assignments` | `id uuid PK`, `tower_id FK`, `supervisor_id FK users`, `assigned_by_id FK users`, `status`, `start_date`, `end_date nullable`, `ended_by_id nullable`, `notes nullable`, timestamps | index `(supervisor_id,status)`, `(tower_id,status)`; impedir dos asignaciones activas equivalentes |

## Visitas y checklists

| Tabla | Campos principales | Restricciones e índices |
|---|---|---|
| `visits` | `id uuid PK`, `code`, `tower_id FK`, `supervisor_id FK`, `checklist_template_id FK nullable`, `status`, fecha/hora, duración, tipo, prioridad/notas nullable, inicio/finalización/cancelación nullable, `created_by_id`, timestamps | `code UNIQUE`, index `(supervisor_id,scheduled_date)`, `(tower_id,scheduled_date)`, `(status,scheduled_date)` |
| `visit_schedule_history` | `id PK`, `visit_id FK`, fecha/hora anterior nullable, nueva fecha/hora, motivo, `changed_by_id`, `created_at` | index `(visit_id,created_at)` |
| `visit_recurrences` | `id PK`, `tower_id`, `supervisor_id`, `checklist_template_id nullable`, frecuencia, fechas, hora, día semana nullable, `active`, `created_by_id`, timestamps | index `(supervisor_id,active)` |
| `checklist_templates` | `id PK`, `name`, `description nullable`, `version int`, `active bool`, timestamps | index `(active,name)`; unique lógico `(name,version)` |
| `checklist_sections` | `id PK`, `template_id FK`, `name`, `description nullable`, `active`, `order int`, timestamps | unique `(template_id,order)` |
| `checklist_items` | `id PK`, `section_id FK`, `name`, `description nullable`, `required`, `active`, `order int`, timestamps | unique `(section_id,order)`; nunca borrar si fue utilizado |
| `inspections` | `id PK`, `visit_id FK`, `template_id`, `template_version`, `status`, `progress`, inicio/finalización, condición general nullable, timestamps | `visit_id UNIQUE`, index `status` |
| `inspection_answers` | `id PK`, `inspection_id FK`, `item_id FK`, condición, observación/responsable/material/prioridad nullable, timestamps | unique `(inspection_id,item_id)` |
| `inspection_photos` | `id PK`, `inspection_id FK`, `answer_id FK nullable`, `storage_key`, mime/latitud/longitud nullable, `created_at` | index `(inspection_id,created_at)`, `answer_id` |

## Incidencias

| Tabla | Campos principales | Restricciones e índices |
|---|---|---|
| `incidents` | `id PK`, `code`, `tower_id FK`, `visit_id/inspection_id/answer_id nullable`, `reported_by_id`, `assigned_to_id nullable`, área/categoría/título/descripción, prioridad/estado, resolución/cierre nullable, timestamps | `code UNIQUE`, index `(tower_id,created_at)`, `(status,priority)` |
| `incident_updates` | `id PK`, `incident_id FK`, `user_id FK`, tipo, comentario nullable, estados anterior/nuevo nullable, `is_internal`, `created_at` | index `(incident_id,created_at)` |
| `incident_photos` | `id PK`, `incident_id FK`, `incident_update_id nullable`, `storage_key`, tipo, `created_at` | index `(incident_id,created_at)` |

## Inventario y solicitudes

| Tabla | Campos principales | Restricciones e índices |
|---|---|---|
| `inventory_items` | `id PK`, `name`, `category_id FK catalog_items`, `unit_id FK`, `active`, timestamps | index `(active,name)` |
| `tower_inventory` | `id PK`, `tower_id FK`, `inventory_item_id FK`, cantidades decimal, ubicación/observación nullable, estado, verificador/fecha nullable, `updated_at` | unique `(tower_id,inventory_item_id)`, index estado |
| `inventory_photos` | `id PK`, `tower_inventory_id FK`, `storage_key`, coordenadas nullable, `created_at` | index `tower_inventory_id` |
| `material_requests` | `id PK`, `code`, `visit_id nullable`, `tower_id`, `requested_by_id`, estado, notas/rechazo nullable, fechas de flujo nullable, timestamps | `code UNIQUE`, index `(requested_by_id,status)`, `(tower_id,created_at)` |
| `material_request_items` | `id PK`, `request_id FK`, `inventory_item_id FK`, cantidades, observación nullable | index `request_id` |
| `material_request_updates` | `id PK`, `request_id FK`, `user_id FK`, estados, comentario nullable, `created_at` | index `(request_id,created_at)` |

## Documentos, sistema y auditoría

| Tabla | Campos principales | Restricciones e índices |
|---|---|---|
| `documents` | `id PK`, `tower_id nullable`, `category_id nullable`, `name`, `storage_key`, `mime_type/description nullable`, `uploaded_by_id`, `status`, fecha documento, timestamps | index `(tower_id,created_at)`, categoría |
| `notifications` | `id PK`, `user_id FK`, título, cuerpo, entidad/ID nullable, `read_at nullable`, `created_at` | index `(user_id,read_at)` |
| `activity_logs` | `id PK`, `user_id nullable`, `tower_id nullable`, acción, tipo/ID entidad, `metadata jsonb nullable`, `created_at` | index `(entity_type,entity_id,created_at)`, `(tower_id,created_at)` |
| `catalog_items` | `id PK`, `type`, `code`, `label`, `active`, `order`, timestamps | unique `(type,code)`, index `(type,active,order)` |
| `system_settings` | `id PK`, `key`, `value jsonb`, `updated_by_id`, timestamps | `key UNIQUE` |

## Relaciones críticas

- User → asignaciones, visitas supervisadas, incidencias reportadas, solicitudes y auditoría.
- Tower → contactos, asignaciones, visitas, incidencias, inventario, documentos.
- Visit → una Inspection; Inspection → múltiples Answers y Photos.
- ChecklistTemplate → Sections → Items; la inspección conserva `template_version`.
- Incident → Updates y Photos; puede originarse en Visit/InspectionAnswer.
- TowerInventory une Tower e InventoryItem; MaterialRequest → Items y Updates.

## RLS prevista

- ADMIN: lectura y escritura operativa completa.
- SUPERVISOR: lectura de torres asignadas; visitas propias; incidencias de sus torres; solicitudes propias; escritura limitada al flujo autorizado.
- Storage y tablas validarán `auth.firebase_uid()` mediante la relación con `users.firebase_uid`; nunca se confiará solamente en la UI.
