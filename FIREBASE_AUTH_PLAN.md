# Plan de Firebase Authentication

No hay Firebase instalado ni conectado en esta fase.

## Flujo objetivo

1. Firebase Authentication valida email/contraseña, restablecimiento y token.
2. El cliente obtiene el `firebaseUid` y un ID token vigente.
3. El backend/Supabase busca `users.firebase_uid`.
4. ADCONDO verifica que el usuario interno exista y tenga estado `ACTIVE`.
5. Se cargan rol, permisos y asignaciones desde PostgreSQL.
6. La aplicación crea su contexto de sesión y los repositorios aplican autorización/RLS.

Firebase será responsable de identidad, credenciales, recuperación de contraseña y sesión/token. ADCONDO será responsable de nombre, rol, estado, perfil laboral, asignaciones y permisos.

## Adaptación del código

- `AppUser.firebaseUid?: string` ya está preparado.
- `AuthProvider` concentra `currentUser`, `role`, permisos e identidad simulada.
- Se sustituirá `signInMock()` por un adaptador `FirebaseAuthGateway.signIn()` sin cambiar layouts.
- En producción se eliminará el selector de rol; el rol siempre vendrá del usuario interno.
- El cierre de sesión invalidará Firebase y limpiará el contexto local.

## Reglas de seguridad

- No guardar tokens manualmente en `localStorage`.
- Verificar token en servidor y estado interno en cada operación sensible.
- No aceptar rol enviado por el cliente.
- Bloquear usuarios `INACTIVE`, `SUSPENDED` o sin registro interno.
- Registrar login, logout, fallos relevantes y cambios de rol en `activity_logs`.
