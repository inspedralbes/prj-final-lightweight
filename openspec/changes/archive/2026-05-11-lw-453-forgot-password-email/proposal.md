## Por qué

La página `/forgot-password` existe actualmente como un stub de UI que muestra un toast de éxito sin enviar ningún email real. Los usuarios que olvidan su contraseña no tienen ninguna vía de recuperación. LW-453 implementa el flujo completo de restablecimiento por email — generación segura de token, envío real del email y formulario de restablecimiento validado — cerrando esta brecha crítica antes de que el MVP se considere listo para producción.

## Qué cambia

- **Nuevo modelo Prisma `PasswordResetToken`**: almacena el token hasheado, la expiración (30 min), un flag de uso y la FK al usuario.
- **`POST /auth/forgot-password`** (NestJS): valida que el email existe en BD, genera un token `crypto.randomBytes`, persiste el hash SHA-256 con expiración de 30 minutos y envía un enlace de restablecimiento via Nodemailer. Rate-limited con `@nestjs/throttler`. La respuesta siempre es genérica (no revela si el email existe).
- **`POST /auth/reset-password`** (NestJS): valida el token en bruto contra el hash almacenado (no expirado, no usado), actualiza `passwordHash` con bcrypt, marca el token como consumido.
- **Transporte de email**: Nodemailer con **Gmail OAuth2** en producción; **Ethereal Email** en local/dev (cuenta de prueba creada automáticamente, credenciales logueadas en consola — sin servicio Docker adicional).
- **Página frontend `ForgotPassword`** actualizada: ahora llama a `POST /auth/forgot-password` en lugar de ser un stub.
- **Nueva página frontend `ResetPassword`** en `/reset-password?token=...`: dos campos de contraseña, mínimo 8 caracteres, llama a `POST /auth/reset-password`, redirige a `/login` al tener éxito.
- **Claves i18n** añadidas a `ca.json`, `es.json`, `en.json` para los textos de UI del restablecimiento.
- **`.env.example`** actualizado con las variables de correo: `MAIL_USER`, `MAIL_OAUTH_CLIENT_ID`, `MAIL_OAUTH_CLIENT_SECRET`, `MAIL_OAUTH_REFRESH_TOKEN`, `FRONTEND_URL`, `RESET_TOKEN_EXPIRY_MINUTES`.

## Capacidades

### Nuevas capacidades

- `password-reset`: Flujo completo de olvido/restablecimiento de contraseña por email — generación de token, envío con Nodemailer (Gmail OAuth2 en prod / Ethereal en dev) y formulario de restablecimiento validado en la SPA.

### Capacidades modificadas

- `auth`: El requisito stub existente "Forgot-password is a UI-only stub" queda **reemplazado** por el flujo real. Los endpoints `POST /auth/forgot-password` y `POST /auth/reset-password` se añaden al módulo auth. La spec de `auth` debe actualizarse para eliminar el escenario stub y añadir los contratos reales de los endpoints.

## Impacto

**Backend — módulo `auth`** (`src/back/src/auth/`):
- Nuevos DTOs: `ForgotPasswordDto`, `ResetPasswordDto`.
- `AuthService` gana los métodos `forgotPassword()` y `resetPassword()`.
- `AuthController` gana dos nuevos handlers `@Post`.
- Nuevo `MailModule` / `MailService` (`src/back/src/mail/`) que envuelve Nodemailer.
- `AuthModule` importa `MailModule` y `ThrottlerModule`.
- `AppModule` importa `ThrottlerModule.forRoot(...)`.

**Prisma** (`src/back/prisma/schema.prisma`):
- Nuevo modelo `PasswordResetToken` con campos: `id`, `token` (hash SHA-256), `userId` (FK → User), `expiresAt`, `used`, `createdAt`.
- Nueva migración commiteada.

**Frontend — feature `auth`** (`src/front/src/features/auth/`):
- `ForgotPassword.tsx`: añadir llamada `api.post('/auth/forgot-password', { email })`.
- Nueva página `ResetPassword.tsx`.
- `App.tsx`: añadir ruta pública `/reset-password`.
- `src/front/src/i18n/locales/{en,es,ca}.json`: nuevas claves bajo `auth.*`.

**Dependencias** (backend):
- `nodemailer` + `@types/nodemailer` (npm install en `src/back/`).
- `@nestjs/throttler` (npm install en `src/back/`).

**Nota de testing**: `MailService` debe ser mockeable via token de inyección `MAIL_SERVICE` para que los tests unitarios de `AuthService` (`auth.service.spec.ts`) no requieran conexión SMTP real. La entrega real de email se verifica manualmente a través de la URL del inbox de Ethereal impresa en consola.

**Jira**: LW-453 (Story) bajo el Epic LW-5 "Autenticación Coach e Infraestructura Web SPA". Los tests (unitarios + E2E) se rastrean por separado en LW-454.
