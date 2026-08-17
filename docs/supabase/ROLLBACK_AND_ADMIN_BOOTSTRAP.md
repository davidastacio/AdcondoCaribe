# Rollback y creación del primer ADMIN

## Regla de rollback

- Antes de cada migración: backup verificable, snapshot de esquema y ventana sin escrituras.
- En staging vacío, rollback preferido: restaurar snapshot o eliminar objetos de la migración en orden inverso.
- En producción con datos, no se hacen `DROP` destructivos: se crea una migración compensatoria, se deshabilita la ruta nueva y se restaura backup si hay corrupción.
- `007_storage.sql` nunca elimina objetos al revertir; solo se impide uso y se conserva evidencia.

| Migración | Rollback previsto |
|---|---|
| 001 | Eliminar función, enums y esquema `app` solo si ninguna migración posterior existe |
| 002 | Eliminar helpers y tablas de configuración/usuarios solo en staging sin datos |
| 003 | Eliminar triggers y tablas en orden checklist → asignaciones → torres |
| 004 | Eliminar hijos de incidencias/inspecciones antes de visitas; restaurar snapshot si contiene datos |
| 005 | Eliminar hijos de solicitudes/inventario antes de maestros; preservar logs/documentos |
| 006 | Revocar grants, eliminar políticas/RPCs y rol `adcondo_server`; mantener tablas |
| 007 | Marcar buckets fuera de servicio; no borrar buckets con objetos ni eliminar archivos |
| 008 | Desactivar semillas insertadas; no borrarlas si ya fueron referenciadas |

Los scripts destructivos de rollback no se incluyen para evitar ejecución accidental. Se prepararán para el estado exacto de staging/producción inmediatamente antes de cada despliegue.

## Primer usuario ADMIN

1. Un propietario autorizado crea la cuenta en Firebase Console o mediante Firebase Admin desde un entorno seguro, con correo verificado y mecanismo de acceso temporal de Firebase. No se escribe contraseña en SQL, archivos, chat ni logs.
2. Se copia únicamente el UID público de Firebase desde el entorno autorizado.
3. Durante la ventana de bootstrap, un operador de base de datos inserta `public.users` con ese UID, rol `ADMIN` y estado `ACTIVE` mediante conexión administrativa auditada.
4. Un segundo responsable verifica correo, UID y rol antes del commit (control de cuatro ojos).
5. Se registra el evento de bootstrap sin incluir tokens ni credenciales.
6. Se prueba login, se fuerza cambio/restablecimiento del acceso temporal si corresponde y se cierra el procedimiento extraordinario.

No se crea un ADMIN mediante seed, formulario público, claim del cliente ni variable de Vercel. Los ADMIN posteriores se crean mediante flujo administrativo protegido y auditado.

