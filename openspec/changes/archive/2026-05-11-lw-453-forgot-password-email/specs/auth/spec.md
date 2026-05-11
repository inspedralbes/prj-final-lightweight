## Requisitos ELIMINADOS

### Requisito: Forgot-password es un stub solo de UI

**Motivo**: Reemplazado por el flujo real de restablecimiento de contraseña implementado en LW-453. `POST /auth/forgot-password` y `POST /auth/reset-password` ahora existen en el backend y la página ForgotPassword hace una llamada real a la API.
**Migración**: El componente `ForgotPassword.tsx` debe actualizarse para llamar a `api.post('/auth/forgot-password', { email })`. El escenario stub (sin petición de red, toast incondicional) ya no es válido. El nuevo comportamiento está completamente especificado en `specs/password-reset/spec.md`.

## Requisitos MODIFICADOS

### Requisito: El flujo de auth es testeable

El flujo de auth DEBE poder ejercerse de extremo a extremo en desarrollo sin servicios de terceros.

#### Escenario: Ruta de QA manual

- **CUANDO** un desarrollador ejecuta el flujo registro → login → API `me` (via respuesta de `/auth/login`) → logout contra `http://localhost:5173` con `docker compose up`
- **ENTONCES** los pasos documentados en `doc/Proves_usuari.md` (sección Auth) pasan todos
- **Y** cualquier cobertura automatizada nueva DEBE añadirse como `*.spec.ts` co-ubicado en `src/back/src/auth/` usando `@nestjs/testing` con un `PrismaService` mockeado, un `JwtService.sign` stubbeado y un `MailService` mockeado

#### Escenario: Ruta de QA manual de forgot-password

- **CUANDO** un desarrollador envía el formulario ForgotPassword en `http://localhost:5173/forgot-password` con el email de un usuario registrado
- **ENTONCES** el backend loguea una URL de previsualización de Ethereal en la consola (formato: `https://ethereal.email/message/...`)
- **Y** el desarrollador puede abrir esa URL en un navegador para verificar que el HTML del email contiene un enlace a `/reset-password?token=<hex>`
- **Y** seguir el enlace y enviar una nueva contraseña en `/reset-password` completa el restablecimiento
- **Y** el desarrollador puede iniciar sesión con la nueva contraseña
