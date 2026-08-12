# ADCONDO del Caribe — Arquitectura de fase 1

## Entendimiento del negocio

ADCONDO supervisa la operación diaria de edificios residenciales. Una visita combina agenda, inicio y cierre, inspección por áreas, evidencias, incidencias, verificación física de materiales y trazabilidad. El supervisor necesita una experiencia móvil y secuencial; administración necesita planificación, control transversal e historial.

El workbook fuente contiene 18 torres, 8 secciones y 29 puntos principales de inspección. La condición `Regular` o `Mal` activa observación, fotografía, responsable y material. La visita no debe cerrarse hasta verificar el inventario existente y fotografiar dónde está almacenado.

## Arquitectura propuesta

- Next.js con App Router y TypeScript estricto.
- UI responsive mediante CSS por tokens, componentes compartidos y Lucide.
- PostgreSQL + Prisma en la fase de persistencia.
- Autenticación basada en sesiones seguras y autorización central por permisos/roles.
- Capa de servicios para separar casos de uso de componentes y persistencia.
- Adaptador de almacenamiento `ObjectStorage` para cambiar de local a S3/R2/Supabase sin tocar el dominio.
- Validación de entrada con Zod; formularios complejos con React Hook Form.
- Auditoría transaccional para acciones críticas.

## Estructura objetivo

```text
src/
  app/                   # rutas, layouts y server actions
    (public)/            # landing y autenticación
    supervisor/          # experiencia del supervisor
    admin/               # experiencia administrativa
    api/                 # endpoints de cámara/upload e integraciones
  components/
    ui/                  # primitivas visuales
    shared/              # marca, estados y navegación
    supervisor/          # ruta, checklist móvil, visita
    admin/               # KPIs, tablas y gráficos
  features/              # lógica por dominio
    visits/ checklists/ incidents/ inventory/ towers/
  server/
    auth/ permissions/ services/ repositories/ storage/
  lib/                   # utilidades, fechas, validación
  data/                  # mock data de prototipo
prisma/
  schema.prisma
```

## Rutas principales

| Ruta | Rol | Propósito |
|---|---|---|
| `/` | Pública | Landing page |
| `/login` | Pública | Acceso y selección demo de rol |
| `/supervisor` | Supervisor | Resumen, KPIs y ruta del día |
| `/supervisor/visitas` | Supervisor | Agenda e historial propio |
| `/supervisor/visitas/[id]` | Supervisor | Inicio, checklist y cierre |
| `/supervisor/torres` | Supervisor | Torres asignadas |
| `/supervisor/incidencias` | Supervisor | Incidencias propias/asignadas |
| `/supervisor/inventario` | Supervisor | Verificación física y solicitudes |
| `/admin` | Administrador | Control global y tendencias |
| `/admin/torres` | Administrador | Catálogo y ficha de torre |
| `/admin/supervisores` | Administrador | Equipo y asignaciones |
| `/admin/visitas` | Administrador | Programación y seguimiento |
| `/admin/checklists` | Administrador | Plantillas y versiones |
| `/admin/incidencias` | Administrador | Flujo de resolución |
| `/admin/inventario` | Administrador | Existencias por torre |
| `/admin/compras` | Administrador | Solicitudes y compras |
| `/admin/reportes` | Administrador | Indicadores y exportaciones |
| `/admin/usuarios` | Administrador | Usuarios, roles y permisos |
| `/admin/configuracion` | Administrador | Parámetros de plataforma |

## Componentes reutilizables

`Brand`, `DashboardShell`, `Sidebar`, `Topbar`, `KpiCard`, `StatusBadge`, `IconBox`, `Panel`, `EmptyState`, `PhotoUploader`, `PriorityBadge`, `TowerCard`, `VisitTimeline`, `ChecklistSection`, `ChecklistAnswer`, `IncidentCard`, `InventoryCount`, `ActivityTimeline` y `ConfirmDialog`.

## Decisiones y vacíos a confirmar antes de producción

1. El Excel usa `Bien`, mientras el requisito define `Óptimo`; se propone normalizar la interfaz y la base de datos a `Óptimo`.
2. Falta definir si una visita puede tener más de un supervisor y quién puede reasignarla después de iniciada.
3. Falta la zona horaria oficial por torre; inicialmente se usaría `America/Santo_Domingo`.
4. Deben definirse política de retención, tamaño y formatos de fotografías/documentos.
5. Falta definir niveles mínimos de inventario por material y torre.
6. Debe aclararse el flujo de aprobación entre solicitud de material y orden de compra.
7. Faltan datos oficiales de contacto, enlaces legales y correo de recuperación de contraseña.
8. La geolocalización queda preparada como opcional, no obligatoria en el MVP.
