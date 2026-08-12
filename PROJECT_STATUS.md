# ADCONDO DEL CARIBE — Estado técnico del proyecto

Auditoría realizada el 12 de agosto de 2026. El proyecto es un MVP local visual y funcional. No utiliza Firebase, Supabase, Storage, Vercel ni autenticación real.

## 1. Resumen ejecutivo

- Estado general: MVP local avanzado, apto para validación funcional y visual, todavía no apto para producción.
- Avance local estimado: 78%.
- Páginas existentes: 46 (26 administrativas, 18 de supervisor y 2 públicas).
- Persistencia: `localStorage` y datos semilla TypeScript.
- Calidad: TypeScript estricto; build de Next.js funcional.
- Riesgos principales: autorización no aplicada a rutas, datos duplicados, dashboards estáticos, ausencia de APIs/backend, archivos muy comprimidos y servicios que ocultan IDs inválidos usando registros fallback.

## 2. Arquitectura actual

- Next.js App Router + React + TypeScript.
- CSS global dividido por módulo; no se usa Tailwind ni shadcn actualmente.
- UI en `src/components` y dominios en `src/features`.
- Repositorios locales en servicios cliente para torres, visitas, incidencias, inventario, usuarios, reportes y documentos.
- Prisma contiene el diseño preliminar para PostgreSQL, pero no está conectado.
- Usuario y rol mock en `src/features/users/service.ts`.
- Matriz de permisos en `src/features/users/permissions.ts`.
- Guards conceptuales en `src/components/auth/role-guard.tsx`, todavía no aplicados a layouts.

## 3. Inventario de rutas

### Públicas

| Ruta | Descripción | Estado |
|---|---|---|
| `/` | Landing corporativa | PARCIAL: diseño y enlaces internos correctos; menú móvil no abre y demo sólo baja a contacto |
| `/login` | Acceso mock por rol | PARCIAL: redirige por rol; no valida identidad, errores ni credenciales reales |

### Administrador

| Ruta | Descripción | Estado |
|---|---|---|
| `/admin` | Dashboard ejecutivo | PARCIAL: visual sólido; KPIs y gráficos están quemados y varios accesos usan `#` |
| `/admin/calendario` | Calendario de visitas | PARCIAL: vistas/filtros locales; mes no representa fechas calendáricas reales |
| `/admin/documentos` | Gestión documental | PARCIAL: alta/eliminación local; ver/descargar no usan archivos reales |
| `/admin/historial` | Timeline global | PARCIAL: consolida varias fuentes; filtro de fecha no se aplica |
| `/admin/incidencias` | Listado y filtros | COMPLETA para MVP local |
| `/admin/incidencias/[incidentId]` | Gestión y cierre | COMPLETA para MVP local |
| `/admin/inventario` | Inventario consolidado | COMPLETA para MVP local |
| `/admin/reportes` | KPIs y analítica | PARCIAL: filtros de torre/supervisor; fechas y exportaciones no son reales |
| `/admin/reportes/torre/[towerId]` | Histórico de torre | PARCIAL: resumen local, sin PDF/Excel |
| `/admin/reportes/visita/[visitId]` | Reporte de visita | PARCIAL: usa inspección local; fotos/exportación pendientes |
| `/admin/solicitudes` | Solicitudes de materiales | COMPLETA para MVP local |
| `/admin/solicitudes/[requestId]` | Flujo administrativo | COMPLETA para MVP local |
| `/admin/supervisores` | Equipo de supervisores | COMPLETA para MVP local |
| `/admin/supervisores/[supervisorId]` | Perfil y asignaciones | COMPLETA para MVP local |
| `/admin/torres` | Listado, KPIs y filtros | COMPLETA para MVP local |
| `/admin/torres/nueva` | Alta de torre | COMPLETA para MVP local |
| `/admin/torres/[towerId]` | Ficha maestra con tabs | PARCIAL: algunos botones apuntan a flujos genéricos y documentos usan otra fuente |
| `/admin/torres/[towerId]/editar` | Edición | COMPLETA para MVP local |
| `/admin/usuarios` | Usuarios y filtros | COMPLETA para MVP local |
| `/admin/usuarios/nuevo` | Alta de usuario | COMPLETA para MVP local |
| `/admin/usuarios/[userId]` | Perfil de usuario | COMPLETA para MVP local |
| `/admin/usuarios/[userId]/editar` | Edición de usuario | COMPLETA para MVP local |
| `/admin/visitas` | Listado y filtros | COMPLETA para MVP local |
| `/admin/visitas/nueva` | Programación y conflictos | COMPLETA para MVP local |
| `/admin/visitas/[visitId]` | Detalle/reprogramar/cancelar | COMPLETA para MVP local |
| `/admin/visitas/[visitId]/editar` | Edición previa al inicio | COMPLETA para MVP local |

No existe `/admin/checklists` ni `/admin/configuracion`; sus entradas de menú son vacías.

### Supervisor

| Ruta | Descripción | Estado |
|---|---|---|
| `/supervisor` | Dashboard de jornada | PARCIAL: gran parte de ruta/KPIs está codificada directamente y hay botones muertos |
| `/supervisor/documentos` | Documentos de torres asignadas | PARCIAL: consulta local; no hay archivo real |
| `/supervisor/incidencias` | Incidencias propias | COMPLETA para MVP local |
| `/supervisor/incidencias/nueva` | Alta con fotos | COMPLETA para MVP local |
| `/supervisor/incidencias/[incidentId]` | Seguimiento/verificación | COMPLETA para MVP local |
| `/supervisor/inventario` | Torres asignadas e inventario | PARCIAL: listado usa catálogo propio de torres en inventario |
| `/supervisor/inventario/[towerId]` | Revisión y reposición | COMPLETA para MVP local |
| `/supervisor/perfil` | Perfil editable permitido | COMPLETA para MVP local |
| `/supervisor/reportes` | Reportes propios | PARCIAL: resumen básico, sin exportación |
| `/supervisor/solicitudes` | Solicitudes propias | COMPLETA para MVP local |
| `/supervisor/solicitudes/nueva` | Alta multimaterial | COMPLETA para MVP local |
| `/supervisor/solicitudes/[requestId]` | Seguimiento | COMPLETA para MVP local |
| `/supervisor/torres` | Torres asignadas | COMPLETA para MVP local |
| `/supervisor/torres/[towerId]` | Perfil limitado | COMPLETA para MVP local |
| `/supervisor/visitas` | Agenda propia | COMPLETA para MVP local |
| `/supervisor/visitas/[visitId]` | Confirmar inicio | COMPLETA para MVP local |
| `/supervisor/visitas/[visitId]/inspeccion` | Checklist móvil | COMPLETA para MVP local |

No existe una ruta administrativa para diseñar/versionar plantillas de checklist.

## 4. Estado por módulo

### Landing

- Logo, fotografía residencial, CTA, secciones y anchors: correctos.
- Responsive CSS presente.
- Pendiente: botón de menú móvil sin estado ni acción; demo no tiene formulario; no existe registro.

### Login y seguridad

- Selector ADMIN/SUPERVISOR redirige correctamente y guarda rol local.
- Cualquier correo/contraseña válida para HTML permite entrar; no hay error de credenciales.
- “¿Olvidaste tu contraseña?” no tiene destino.
- Riesgo crítico: `AdminRoute` y `SupervisorRoute` no se usan en layouts. Cualquier persona puede abrir URLs de ambos roles.
- Los permisos de incidencias sí se aplican parcialmente; la matriz general todavía no gobierna todas las mutaciones.

### Dashboards

- Admin: tarjetas y gráficos visuales, pero cifras en `src/app/admin/page.tsx` no provienen de servicios.
- Supervisor: nombre, fecha, ruta, estado de torres, checklist e incidencias están mayormente hardcodeados.
- El dashboard de supervisor no filtra todo desde `currentUser`; páginas internas sí filtran por `usr-juan` o nombre.

### Torres

- Crear, editar, desactivar y consultar funcionan localmente.
- Tabs funcionan, pero visitas todavía importan la lista semilla antigua en `TowerSummary`.
- `Tower.supervisors` duplica la relación `TowerAssignment`.
- Documentos embebidos en `Tower` duplican el repositorio general de documentos.
- Servicios devuelven la primera torre ante ID inválido, en lugar de 404.

### Visitas e inspección

- Programar, detectar conflicto, editar, reprogramar, cancelar, iniciar, guardar y finalizar funcionan localmente.
- Recurrencia sólo guarda frecuencia; no materializa series.
- Conviven `mock-data.ts`, `service.ts`, `storage.ts` y estados separados por visita.
- El dashboard no consume el repositorio nuevo.
- Plantilla de checklist está fija como `checklist-general`.

### Checklist

- Secciones, condiciones Óptimo/Regular/Mal/N/A, observación, prioridad, fotos, progreso y autosave funcionan.
- No existe CRUD de plantillas, versión, activación ni catálogo administrativo.
- Fotos usan object/data URLs locales; no sobreviven como archivos gestionados.

### Incidencias

- Alta directa o desde checklist, fotos, estados, asignación, comentarios, solución, verificación y cierre funcionan localmente.
- Existe una matriz de permisos específica.
- Catálogo de torres duplicado y sólo contiene seis de las ocho torres.
- Actores/responsables siguen hardcodeados en servicios.

### Inventario y solicitudes

- Revisión, stock, fotos, solicitud, aprobación, compra y entrega funcionan localmente.
- Catálogo de torres/materiales duplicado.
- Usuario actual y actor administrativo están hardcodeados.
- Fotos con object URL dejan de ser válidas al reiniciar navegador.

### Usuarios y asignaciones

- CRUD local, perfil, rol/estado y asignaciones many-to-many con historial funcionan.
- `firebaseUid` y permisos están preparados conceptualmente.
- Guard general no aplicado.
- Perfil usa visitas semilla antiguas, no repositorio centralizado.

### Reportes, historial y documentos

- Rutas y consolidación local funcionan.
- Filtros de fecha son visuales en algunos reportes/historial.
- PDF/Excel/descarga son placeholders explícitos.
- Existen dos modelos UI de documentos: `TowerDocument` y `AppDocument`.

### Configuración

- VACÍA/INEXISTENTE.
- Estados, categorías, áreas, unidades, tipos de visita, prioridades y catálogos están dispersos en TypeScript.

## 5. Botones y enlaces

### Funcionales

- Login mock y cambio de rol.
- Crear/editar/desactivar torre.
- Crear/editar usuario.
- Asignar/retirar torre.
- Programar/editar/reprogramar/cancelar visita.
- Iniciar/continuar/finalizar inspección.
- Crear/actualizar/verificar/cerrar incidencia.
- Revisar inventario y gestionar solicitudes.
- Subir/eliminar documento mock.
- Navegación de listados, perfiles, tabs y filtros implementados.

### Parciales

- Exportar PDF/Excel: sólo informa que está pendiente.
- Compartir: copia URL, no crea acceso público.
- Ver/descargar documento: mensajes mock, sin archivo.
- Solicitar demo: anchor a contacto, sin formulario ni envío.
- Recurrencia: guarda selección, no genera visitas.
- Calendario Mes/Semana/Día: representación simplificada, no calendario real.

### Sin función o destino útil

- Menú móvil de landing.
- Recuperar contraseña.
- Sidebar: Checklists (ambos roles) y Configuración (admin), todos con `#`.
- Campana de notificaciones y selector/avatar de topbar.
- Dashboard admin: fecha, “Ver reporte”, “Ver todas”, “Ver compras”, “Gestionar solicitudes”.
- Dashboard supervisor: fecha, “Ver calendario”, “Ver todas”, “Ver completo”, “5 secciones más”, “Revisar inventario”, CTA de continuar y navegación inferior.
- En ficha de torre, “Programar visita” apunta al listado del supervisor, no al formulario admin preseleccionado.

## 6. Datos mock y destino futuro

| Archivo | Datos | Tabla/servicio futuro |
|---|---|---|
| `src/features/towers/mock-data.ts` | Torres, contactos, fotos, documentos, actividad | `Tower`, `TowerContact`, `TowerPhoto`, `Document`, `ActivityLog` |
| `src/features/visits/mock-data.ts` | Visitas y checklist completo | `Visit`, `ChecklistTemplate`, `ChecklistSection`, `ChecklistItem` |
| `src/features/incidents/mock-data.ts` | Incidencias, responsables, áreas y torres | `Incident`, `IncidentUpdate`, `IncidentPhoto`, catálogos |
| `src/features/inventory/mock-data.ts` | Materiales, stock, torres y solicitudes | `InventoryItem`, `TowerInventory`, `MaterialRequest` |
| `src/features/users/mock-data.ts` | Usuarios, asignaciones y actividad | `User`, `TowerAssignment`, `ActivityLog` |
| `src/features/reports/service.ts` | Documentos iniciales y timeline agregado | `Document`, `Report`, `ActivityLog` |
| `src/app/admin/page.tsx` | KPIs y series de gráficos | Vistas/queries agregadas Supabase |
| `src/app/supervisor/page.tsx` | Ruta, KPIs, checklist e incidencias | Queries filtradas por usuario actual |
| `src/components/visits/visit-form.tsx` | Tipos, duraciones y checklist fijo | Catálogos y `ChecklistTemplate` |
| `src/components/inventory/inventory-editor.tsx` | Unidades | Catálogo de unidades |

## 7. Componentes y deuda arquitectónica

- Archivos comprimidos en una o pocas líneas dificultan revisión, diffs y mantenimiento.
- `incident-detail.tsx` (~9 KB), `tower-summary.tsx` (~6.6 KB), `tower-form.tsx` y varias páginas mezclan UI, reglas y acceso a datos.
- CSS global es grande y comprimido: `globals.css` ~21 KB, `visits.css` ~19 KB, `incidents.css` ~18 KB.
- Duplicaciones principales:
  - Torres en towers, incidents e inventory.
  - Visitas en `mock-data` y repositorio v2.
  - Estado de visita en repositorio y claves individuales de storage.
  - Documentos en torre y reportes.
  - Permisos generales y permisos específicos de incidencias.
- `getTower`, `getUser`, `getIncident`, `getRequest` y `getVisitRecord` usan fallback al primer registro; deben devolver `null`/404.
- Los servicios cliente tienen actores `usr-admin`/`usr-juan` hardcodeados.
- Falta una capa única de repositorios/interfaces inyectables y validación Zod.

## 8. Responsive

- Existen media queries para landing, dashboards, visitas, checklist, incidencias, inventario, torres, usuarios, agenda y reportes.
- Las rutas auditadas no presentan overflow horizontal en viewport desktop de 1280 px.
- La experiencia del supervisor usa cards y navegación adaptada; checklist y carga de fotos están diseñados para touch.
- Riesgos pendientes:
  - Calendario mensual se oculta en móvil, pero la vista Agenda no se activa automáticamente; puede quedar un área vacía si el usuario mantiene “Mes”.
  - Tablas/listas administrativas se convierten parcialmente a cards, pero requieren QA física a 390/768 px.
  - Navegación inferior del dashboard supervisor es decorativa.
  - Sidebar móvil funciona; menú móvil de landing no.

## 9. Preparación para Supabase

1. Definir una migración Prisma estable y resolver relaciones/enum duplicados.
2. Crear repositorios con interfaces (`TowerRepository`, `VisitRepository`, etc.) y adaptadores local/Supabase.
3. Migrar seeds a tablas y eliminar catálogos duplicados.
4. Aplicar RLS por rol, supervisor y asignaciones activas.
5. Llevar mutaciones a server actions/API con Zod y transacciones.
6. Implementar Storage para fotos/documentos y URLs firmadas.
7. Crear `ActivityLog` en backend para que la auditoría no sea manipulable.
8. Implementar agregaciones/reportes mediante vistas o funciones SQL.
9. Añadir paginación, índices y manejo real de errores/404.

## 10. Preparación para Firebase Authentication

1. Configurar Firebase Admin en servidor y SDK cliente sólo donde corresponda.
2. Sustituir selector mock de login por sesión verificable.
3. Mapear `firebaseUid` a `User` interno y resolver rol/estado desde base de datos.
4. Aplicar guards en `admin/layout.tsx` y `supervisor/layout.tsx`, además de autorización backend.
5. Reemplazar nombres/IDs hardcodeados por `currentUser` de sesión.
6. Implementar cierre de sesión, recuperación, estados suspendido/inactivo y errores.
7. No confiar en ocultar botones; cada mutación debe validar permisos en servidor.

## 11. Orden recomendado hacia producción

1. Limpieza/refactor de fuentes duplicadas y servicios con interfaces.
2. Completar plantillas administrativas de checklist y Configuración/catálogos.
3. Corregir dashboards para consumir servicios reales y conectar todos los accesos.
4. Consolidar esquema Prisma y migraciones.
5. Conectar Supabase/PostgreSQL y Storage en entorno de desarrollo.
6. Conectar Firebase Auth y autorización/RLS.
7. Migrar mock data, verificar integridad y eliminar fallbacks silenciosos.
8. Implementar exportación PDF/Excel y documentos reales.
9. Pruebas unitarias, integración, E2E, accesibilidad y dispositivos móviles físicos.
10. GitHub CI, variables de entorno, staging en Vercel, observabilidad y producción.

## 12. Criterios mínimos antes de producción

- Cero enlaces `#` en la aplicación autenticada.
- Cero rutas administrativas accesibles por supervisor.
- Cero mutaciones sólo del lado cliente.
- Cero actores o IDs de usuario hardcodeados.
- Una única fuente para torres, visitas, usuarios y documentos.
- 404 real para entidades inexistentes.
- RLS y auditoría backend verificadas.
- Pruebas E2E de los flujos críticos y QA responsive 390/768/1280 px.

## 13. Verificación técnica de cierre

- `npm run typecheck`: aprobado, sin errores.
- `npm run lint`: aprobado, sin errores; quedan 8 advertencias de imports o variables sin uso.
- `npm run build`: aprobado con Next.js 15.5.23; 31 páginas estáticas generadas y rutas dinámicas compiladas.
- Prueba HTTP local: 45 rutas públicas, administrativas y de supervisor respondieron correctamente; las 15 rutas dinámicas representativas devolvieron HTTP 200 tras reiniciar una sola instancia limpia del servidor.
- La validación adicional de Prisma no se ejecutó porque Prisma no está instalado como dependencia local y esta fase prohíbe descargar o conectar servicios externos.
- Se detectó que varias instancias antiguas de desarrollo en el puerto 3010 pueden provocar errores falsos de chunks (`Cannot find module './532.js'`). La recuperación segura es detener las instancias duplicadas, eliminar exclusivamente `.next` y arrancar una sola instancia.

## 14. PRODUCTION READINESS

### Preparación incorporada

- `AuthProvider` centraliza usuario actual, rol, permisos, sesión simulada y cierre de sesión.
- Los layouts `/admin/*` y `/supervisor/*` están protegidos por rol; ADMIN puede consultar ambas áreas y SUPERVISOR no puede renderizar el área administrativa.
- La matriz de permisos está centralizada en `src/auth/permissions.ts`.
- Existe una composición única de repositorios en `src/repositories/index.ts`, con contratos asíncronos preparados para adaptadores Supabase.
- Los nuevos catálogos y plantillas de checklist se almacenan en una fuente mock central y servicios desacoplados.
- Las listas duplicadas de torres en incidencias e inventario ahora se derivan de `seedTowers`.
- Los dashboards calculan métricas desde los registros locales y filtran la operación del supervisor usando `currentUser`, asignaciones e IDs.
- Se añadieron `/admin/configuracion` y `/admin/configuracion/checklist`, con altas, edición, orden y desactivación lógica.
- `AppUser.firebaseUid` y el contrato de Storage están listos para futuras implementaciones Firebase/Supabase.
- Los diseños de base de datos, autenticación y almacenamiento están en `SUPABASE_SCHEMA_PLAN.md`, `FIREBASE_AUTH_PLAN.md` y `STORAGE_PLAN.md`.

### Condiciones antes de integrar servicios reales

- Sustituir gradualmente imports directos de servicios antiguos por los repositorios compuestos.
- Terminar de normalizar campos derivados (`towerName`, `supervisorName`) en los mocks históricos.
- Reemplazar el guard local por verificación de token en servidor y políticas RLS; el guard actual es correcto para la fase local, no es seguridad de producción.
- Añadir pruebas automatizadas de repositorios, permisos y flujos críticos.
- Conservar una sola instancia del servidor de desarrollo para evitar cachés/chunks inconsistentes.

**Decisión:** el proyecto queda preparado para comenzar una integración controlada con Supabase y Firebase después de aprobar esta fase, pero no para publicar en producción sin RLS, autenticación real, migraciones y pruebas E2E.

### Validación final de esta fase

- TypeScript: aprobado sin errores.
- ESLint: aprobado sin errores ni advertencias.
- Build Next.js: aprobado; 33 páginas estáticas generadas y rutas dinámicas compiladas.
- Seguridad manual: sesión SUPERVISOR bloqueada correctamente al abrir `/admin/torres` y muestra “Acceso no autorizado”.
- Sesión ADMIN: dashboard, `/admin/configuracion` y `/admin/configuracion/checklist` accesibles.
- Preparación local estimada: **88%**. Lo restante corresponde principalmente a normalización total de datos históricos, backend real, RLS, exportaciones/archivos reales y pruebas automatizadas.
