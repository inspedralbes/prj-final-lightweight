## 1. Dependencias y entorno

- [x] 1.1 En `src/back/`, instalar `nodemailer` y `@types/nodemailer`: `npm install nodemailer && npm install -D @types/nodemailer`
- [x] 1.2 En `src/back/`, instalar `@nestjs/throttler`: `npm install @nestjs/throttler`
- [x] 1.3 Añadir las vars de correo + restablecimiento al `.env.example` raíz: `MAIL_USER`, `MAIL_OAUTH_CLIENT_ID`, `MAIL_OAUTH_CLIENT_SECRET`, `MAIL_OAUTH_REFRESH_TOKEN`, `FRONTEND_URL`, `RESET_TOKEN_EXPIRY_MINUTES`
- [x] 1.4 Añadir las mismas vars a `src/back/.env.example` (si existe por separado)
- [x] 1.5 Añadir las mismas vars al archivo `.env` local con valores de ejemplo para dev (p. ej. `FRONTEND_URL=http://localhost:5173`, `RESET_TOKEN_EXPIRY_MINUTES=30`; dejar `MAIL_*` en blanco — se usará Ethereal)

## 2. Base de datos — Schema Prisma y migración

- [x] 2.1 Añadir la relación `passwordResetTokens PasswordResetToken[]` al modelo `User` en `src/back/prisma/schema.prisma`
- [x] 2.2 Añadir el modelo `PasswordResetToken` a `schema.prisma`:
  ```prisma
  model PasswordResetToken {
    id        Int      @id @default(autoincrement())
    token     String   @unique
    userId    Int      @map("user_id")
    expiresAt DateTime @map("expires_at")
    used      Boolean  @default(false)
    createdAt DateTime @default(now()) @map("created_at")
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    @@map("password_reset_tokens")
  }
  ```
- [x] 2.3 Ejecutar `npx prisma validate` dentro del contenedor backend (o en local con la BD corriendo) para confirmar que el schema es válido
- [x] 2.4 Ejecutar `npx prisma migrate dev --name add_password_reset_token` para generar y aplicar la migración
- [x] 2.5 Verificar que el archivo de migración existe bajo `src/back/prisma/migrations/` y commitearlo

## 3. Backend — MailModule

- [x] 3.1 Crear el directorio `src/back/src/mail/`
- [x] 3.2 Crear `src/back/src/mail/mail.service.ts` con la clase `MailService`:
  - Inyectar `ConfigService`
  - En el constructor: si `NODE_ENV === 'production'` crear transporte Gmail OAuth2; si no, llamar a `nodemailer.createTestAccount()` y crear transporte Ethereal
  - Implementar `async sendPasswordReset(to: string, resetLink: string): Promise<void>` — envía email HTML con el enlace; en dev loguea `nodemailer.getTestMessageUrl(info)` en consola
- [x] 3.3 Crear `src/back/src/mail/mail.module.ts` exportando `MailService`
- [x] 3.4 Importar `MailModule` en `AuthModule`

## 4. Backend — Configuración del Throttler

- [x] 4.1 Importar `ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` en `AppModule` (límite global por defecto)
- [x] 4.2 Añadir el proveedor `APP_GUARD` para `ThrottlerGuard` en `AppModule` para que se aplique globalmente

## 5. Backend — DTOs

- [x] 5.1 Crear `src/back/src/auth/dto/forgot-password.dto.ts` con `ForgotPasswordDto { @IsEmail() email: string }`
- [x] 5.2 Crear `src/back/src/auth/dto/reset-password.dto.ts` con `ResetPasswordDto { @IsString() @IsNotEmpty() token: string; @IsString() @MinLength(8) password: string }`

## 6. Backend — Métodos de AuthService

- [x] 6.1 Añadir `async forgotPassword(dto: ForgotPasswordDto): Promise<void>` a `AuthService`:
  - Buscar usuario por email; si no existe devolver inmediatamente (sin error, sin email)
  - Invalidar tokens no usados existentes: `updateMany` donde `userId=user.id AND used=false`, establecer `used=true`
  - Generar `crypto.randomBytes(32).toString('hex')` como token en bruto
  - Calcular hash SHA-256: `createHash('sha256').update(rawToken).digest('hex')`
  - Crear `PasswordResetToken` con `token=hash`, `userId`, `expiresAt=now + RESET_TOKEN_EXPIRY_MINUTES`
  - Llamar a `mailService.sendPasswordReset(user.email, \`${frontendUrl}/reset-password?token=${rawToken}\`)`
- [x] 6.2 Añadir `async resetPassword(dto: ResetPasswordDto): Promise<void>` a `AuthService`:
  - Calcular hash de `dto.token`
  - Buscar `PasswordResetToken` donde `token=hash AND used=false AND expiresAt > now()`
  - Si no existe: lanzar `BadRequestException('Invalid or expired token')`
  - Hashear nueva contraseña: `bcrypt.hash(dto.password, 10)`
  - Actualizar `User.passwordHash` para el `userId` del token
  - Establecer `PasswordResetToken.used = true`

## 7. Backend — Endpoints de AuthController

- [x] 7.1 Añadir `@Post('forgot-password') @Throttle({ default: { limit: 3, ttl: 60000 } }) async forgotPassword(@Body() dto: ForgotPasswordDto)` a `AuthController` — devuelve `{ message: 'If this email exists, a reset link has been sent.' }`
- [x] 7.2 Añadir `@Post('reset-password') async resetPassword(@Body() dto: ResetPasswordDto)` a `AuthController` — devuelve `{ message: 'Password reset successfully.' }`
- [x] 7.3 Ejecutar `npm run build` en `src/back/` para confirmar que no hay errores TypeScript
- [x] 7.4 Ejecutar `npm run lint` en `src/back/` y corregir cualquier problema

## 8. Frontend — Claves i18n

- [x] 8.1 Añadir en `src/front/src/i18n/locales/en.json` bajo `auth`:
  - `"newPassword": "New password"`
  - `"confirmPassword": "Confirm password"`
  - `"resetPasswordButton": "Reset Password"`
  - `"resetTokenInvalid": "This link is invalid or has expired."`
  - `"requestNewReset": "Request a new reset link"`
- [x] 8.2 Añadir en `en.json` bajo `messages`:
  - `"resetEmailSent": "If this email exists, check your inbox."`
  - `"passwordResetSuccess": "Password reset. You can now log in."`
- [x] 8.3 Añadir las mismas claves (traducidas) en `src/front/src/i18n/locales/es.json`
- [x] 8.4 Añadir las mismas claves (traducidas) en `src/front/src/i18n/locales/ca.json`

## 9. Frontend — Actualización de la página ForgotPassword

- [x] 9.1 Actualizar `src/front/src/features/auth/pages/ForgotPassword.tsx`:
  - Importar `api` desde `@/shared/utils/api`
  - En `handleSubmit`, reemplazar el stub con `await api.post('/auth/forgot-password', { email })`
  - Envolver en try/catch — mostrar el toast de éxito genérico tanto en el bloque de éxito como en el de error (evitar filtración de enumeración de emails)
  - Mantener la redirección a `/login` tras 2 segundos independientemente del resultado

## 10. Frontend — Página ResetPassword (nueva)

- [x] 10.1 Crear `src/front/src/features/auth/pages/ResetPassword.tsx`:
  - Leer `token` de `useSearchParams()`
  - Dos inputs controlados: `newPassword` + `confirmPassword`
  - Validación en cliente: las contraseñas deben coincidir y tener ≥ 8 caracteres; mostrar error en línea, no llamar a la API si es inválido
  - Al enviar válido: llamar a `api.post('/auth/reset-password', { token, password: newPassword })`
  - En éxito: mostrar toast `t("messages.passwordResetSuccess")`, redirigir a `/login` tras 2 s
  - En error: mostrar `t("auth.resetTokenInvalid")` con un `<Link to="/forgot-password">{t("auth.requestNewReset")}</Link>`
  - Usar el mismo layout visual que `ForgotPassword.tsx` (diseño de panel dividido, branding naranja)
- [x] 10.2 Añadir la ruta pública `/reset-password` a `src/front/src/App.tsx`:
  ```tsx
  import ResetPassword from "@/features/auth/pages/ResetPassword";
  // ...
  <Route path="/reset-password" element={<ResetPassword />} />
  ```
- [x] 10.3 Ejecutar `npm run build` en `src/front/` (`tsc -b && vite build`) para confirmar que no hay errores TypeScript
- [x] 10.4 Ejecutar `npm run lint` en `src/front/` y corregir cualquier problema

## 11. Verificación QA manual

- [x] 11.1 Arrancar el stack con `docker compose up` desde la raíz del repositorio
- [x] 11.2 Navegar a `http://localhost:5173/forgot-password`, enviar el email de un usuario registrado
- [x] 11.3 Revisar los logs del backend para la URL de previsualización de Ethereal; abrirla en un navegador y verificar que el HTML del email contiene un enlace válido `/reset-password?token=<hex>`
- [x] 11.4 Seguir el enlace de restablecimiento; verificar que la página `ResetPassword` renderiza correctamente
- [x] 11.5 Enviar contraseñas que no coinciden — confirmar error en línea, sin llamada a la API
- [x] 11.6 Enviar una contraseña de menos de 8 caracteres — confirmar error en línea
- [x] 11.7 Enviar una nueva contraseña válida — confirmar toast de éxito y redirección a `/login`
- [x] 11.8 Iniciar sesión con la nueva contraseña — confirmar que funciona
- [x] 11.9 Intentar reutilizar el mismo enlace de restablecimiento — confirmar respuesta `400 Invalid or expired token` del backend y error mostrado en la página
- [x] 11.10 Enviar un email desconocido a `/forgot-password` — confirmar error 404 mostrado en línea bajo el campo email
- [x] 11.11 Añadir los pasos de QA manual 11.2–11.10 a `doc/Proves_usuari.md` bajo una sección "Auth — Recuperación de contraseña"

## 12. Checklist de tests y verificación

- [x] 12.1 `npm run lint` sin errores en `src/back/`
- [x] 12.2 `npm run build` sin errores en `src/back/`
- [x] 12.3 `npm test` (Vitest) sin errores en `src/back/` — los tests existentes no deben regresar
- [x] 12.4 `npx prisma validate` sin errores en `src/back/`
- [x] 12.5 `npm run lint` sin errores en `src/front/`
- [x] 12.6 `npm run build` sin errores en `src/front/`
- [x] 12.7 Confirmar que todas las nuevas vars de entorno están en `.env.example` (raíz y backend)
- [x] 12.8 Confirmar que no hay secretos hardcodeados en ningún archivo commiteado
