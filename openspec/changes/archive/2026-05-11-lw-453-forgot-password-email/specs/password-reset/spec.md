## Requisitos AÑADIDOS

### Requisito: Endpoint de forgot-password

El sistema DEBE exponer `POST /auth/forgot-password` que acepta una dirección de email, la busca en la base de datos y — si la encuentra — genera un token de restablecimiento seguro de un solo uso, persiste su hash SHA-256 en `PasswordResetToken` y envía un enlace de restablecimiento al email registrado. La respuesta DEBE ser siempre `200 OK` con un mensaje genérico independientemente de si el email existe, para prevenir la enumeración de emails. El endpoint DEBE estar limitado a 3 peticiones por minuto por IP mediante `@nestjs/throttler`.

#### Escenario: El email existe — token creado y email enviado

- **DADO** que existe un usuario registrado con email `user@example.com` en la base de datos
- **CUANDO** un Visitante hace POST a `/auth/forgot-password` con `{ "email": "user@example.com" }`
- **ENTONCES** la respuesta es `200 OK` con body `{ "message": "If this email exists, a reset link has been sent." }`
- **Y** se crea una fila `PasswordResetToken` con `userId` correspondiente al usuario, `used = false` y `expiresAt` aproximadamente 30 minutos desde ahora
- **Y** el campo `token` almacenado es el hex SHA-256 del token en bruto (no el token en bruto)
- **Y** se envía un email a `user@example.com` con una URL de la forma `${FRONTEND_URL}/reset-password?token=<raw-token>`

#### Escenario: El email no existe — sin filtración

- **DADO** que no existe ningún usuario con email `unknown@example.com`
- **CUANDO** un Visitante hace POST a `/auth/forgot-password` con `{ "email": "unknown@example.com" }`
- **ENTONCES** la respuesta es `200 OK` con el mismo body genérico
- **Y** no se crea ninguna fila `PasswordResetToken`
- **Y** no se envía ningún email

#### Escenario: Límite de tasa superado

- **DADO** que un Visitante ya ha enviado 3 peticiones a `POST /auth/forgot-password` en 60 segundos desde la misma IP
- **CUANDO** la misma IP envía una 4ª petición en el mismo minuto
- **ENTONCES** la respuesta es `429 Too Many Requests`

#### Escenario: Formato de email inválido

- **CUANDO** un Visitante hace POST a `/auth/forgot-password` con `{ "email": "no-es-un-email" }`
- **ENTONCES** la respuesta es `400 Bad Request` del `ValidationPipe` global (class-validator `@IsEmail()`)

#### Escenario: El token pendiente existente se invalida al volver a solicitar

- **DADO** que un usuario ya tiene un `PasswordResetToken` no expirado y no usado en la base de datos
- **CUANDO** el mismo usuario solicita exitosamente un nuevo restablecimiento
- **ENTONCES** el token antiguo se marca como `used = true` antes de crear el nuevo
- **Y** solo el enlace del nuevo token es válido

### Requisito: Endpoint de reset-password

El sistema DEBE exponer `POST /auth/reset-password` que acepta un token de restablecimiento en bruto y una nueva contraseña. El endpoint DEBE validar el token (coincidencia de hash, `used = false`, `expiresAt > now()`), actualizar el `passwordHash` del usuario con bcrypt (10 rondas) y marcar el token como consumido. En cualquier fallo de validación la respuesta DEBE ser `400 Bad Request` con el mensaje `"Invalid or expired token"`. En caso de éxito la respuesta es `200 OK`.

#### Escenario: Restablecimiento de contraseña exitoso

- **DADO** un `PasswordResetToken` válido, no expirado y no usado para el usuario `user@example.com`
- **Y** el frontend tiene el token en bruto del enlace del email
- **CUANDO** un Visitante hace POST a `/auth/reset-password` con `{ "token": "<raw>", "password": "NewPass123!" }`
- **ENTONCES** la respuesta es `200 OK` con body `{ "message": "Password reset successfully." }`
- **Y** `User.passwordHash` se actualiza a `bcrypt.hash("NewPass123!", 10)`
- **Y** `PasswordResetToken.used` se establece a `true`
- **Y** el usuario puede iniciar sesión con `NewPass123!` via `POST /auth/login`

#### Escenario: Token expirado

- **DADO** que existe un `PasswordResetToken` con `expiresAt` en el pasado
- **CUANDO** un Visitante hace POST a `/auth/reset-password` con el token en bruto asociado
- **ENTONCES** la respuesta es `400 Bad Request` con `{ "message": "Invalid or expired token" }`
- **Y** la contraseña del usuario no cambia

#### Escenario: Token ya usado

- **DADO** un `PasswordResetToken` con `used = true`
- **CUANDO** un Visitante hace POST a `/auth/reset-password` con el token en bruto asociado
- **ENTONCES** la respuesta es `400 Bad Request` con `{ "message": "Invalid or expired token" }`

#### Escenario: Token inexistente

- **CUANDO** un Visitante hace POST a `/auth/reset-password` con una cadena arbitraria que no coincide con ningún hash almacenado
- **ENTONCES** la respuesta es `400 Bad Request` con `{ "message": "Invalid or expired token" }`

#### Escenario: Nueva contraseña demasiado corta

- **CUANDO** un Visitante hace POST a `/auth/reset-password` con un token válido y `"password": "corta"` (menos de 8 caracteres)
- **ENTONCES** la respuesta es `400 Bad Request` del `ValidationPipe` (class-validator `@MinLength(8)`)

### Requisito: Modelo Prisma PasswordResetToken

El sistema DEBE persistir los tokens de restablecimiento en una nueva tabla `password_reset_tokens` a través del modelo Prisma `PasswordResetToken`. El campo `token` DEBE almacenar el hash hex SHA-256 del token en bruto (nunca el token en bruto). El modelo DEBE eliminar en cascada cuando el `User` padre se elimine.

#### Escenario: Token eliminado cuando se elimina el usuario

- **DADO** que un usuario tiene una o más filas `PasswordResetToken`
- **CUANDO** la fila del usuario se elimina de la base de datos (p. ej., eliminación de cuenta)
- **ENTONCES** todas las filas `PasswordResetToken` asociadas se eliminan en cascada (`onDelete: Cascade`)

#### Escenario: Unicidad del token

- **DADO** que un token en bruto se genera como `crypto.randomBytes(32).toString('hex')`
- **CUANDO** su hash SHA-256 se almacena en `PasswordResetToken.token`
- **ENTONCES** una restricción `@unique` en `token` evita dos filas con el mismo hash

### Requisito: MailService — Nodemailer con transporte adaptado al entorno

El sistema DEBE proporcionar un `MailService` (en `src/back/src/mail/`) que envíe emails transaccionales via Nodemailer. En producción (`NODE_ENV=production`) DEBE usar credenciales Gmail OAuth2 obtenidas de las variables de entorno. En todos los demás entornos DEBE crear automáticamente una cuenta de prueba Ethereal y loguear la URL de previsualización en la consola. El servicio DEBE ser inyectable y mockeable mediante un token de proveedor de NestJS.

#### Escenario: Email enviado en producción con Gmail OAuth2

- **DADO** que `NODE_ENV=production` y `MAIL_USER`, `MAIL_OAUTH_CLIENT_ID`, `MAIL_OAUTH_CLIENT_SECRET`, `MAIL_OAUTH_REFRESH_TOKEN` están definidos
- **CUANDO** se llama a `MailService.sendPasswordReset(email, resetLink)`
- **ENTONCES** un transporte Nodemailer con `{ service: 'gmail', auth: { type: 'OAuth2', ... } }` entrega el email al destinatario
- **Y** no se crea ninguna cuenta Ethereal

#### Escenario: Email enviado en desarrollo con Ethereal

- **DADO** que `NODE_ENV` no es `production`
- **CUANDO** se llama a `MailService.sendPasswordReset(email, resetLink)`
- **ENTONCES** se usa un transporte Ethereal de Nodemailer (cuenta de prueba creada automáticamente)
- **Y** la URL de previsualización de Ethereal (`nodemailer.getTestMessageUrl(info)`) se loguea con `console.log`
- **Y** no se requieren credenciales Gmail

#### Escenario: Testeabilidad — MailService es mockeable

- **DADO** un test unitario Vitest/Jest para `AuthService`
- **CUANDO** el `TestingModule` se construye con `overrideProvider(MailService).useValue({ sendPasswordReset: vi.fn() })`
- **ENTONCES** `AuthService.forgotPassword()` puede testearse sin ninguna conexión SMTP

### Requisito: Página frontend ForgotPassword — llamada real a la API

La página `ForgotPassword` de la SPA en `/forgot-password` DEBE llamar a `POST /auth/forgot-password` con el email enviado en lugar de simular el éxito. El formulario DEBE deshabilitar el botón de envío mientras la petición está en vuelo. Si el backend devuelve error (email no registrado), DEBE mostrarse un mensaje de error en línea bajo el campo email. En caso de éxito DEBE mostrarse un toast y redirigir a `/login` tras ~2 segundos.

#### Escenario: Email enviado — ruta de éxito

- **DADO** que un Visitante está en `/forgot-password`
- **CUANDO** el usuario introduce un email registrado y envía el formulario
- **ENTONCES** se llama a `api.post('/auth/forgot-password', { email })`
- **Y** el botón de envío se deshabilita mientras la petición está pendiente
- **Y** al recibir `200 OK` se muestra un toast de éxito con `t("messages.resetEmailSent")`
- **Y** tras 2 segundos la SPA navega a `/login`

#### Escenario: Email no registrado — error visible

- **DADO** que un Visitante introduce un email que no existe en la base de datos
- **CUANDO** envía el formulario
- **ENTONCES** el backend devuelve `404 Not Found`
- **Y** se muestra un error en línea con `t("auth.emailNotRegistered")` bajo el campo email
- **Y** no se redirige a `/login`

#### Escenario: Error de red

- **DADO** que el backend no está disponible
- **CUANDO** el Visitante envía el formulario
- **ENTONCES** se muestra el error en línea bajo el campo email
- **Y** no se redirige a `/login`

### Requisito: Página frontend ResetPassword

La SPA DEBE exponer una nueva página `ResetPassword` en `/reset-password?token=...`. La página DEBE renderizar dos campos de contraseña ("nueva contraseña" + "confirmar contraseña"), validar que coinciden y que cada una tiene al menos 8 caracteres antes de llamar al backend, llamar a `POST /auth/reset-password` con el token de la cadena de consulta y la nueva contraseña, mostrar un toast de éxito y redirigir a `/login` en caso de éxito, y mostrar un mensaje de error con un enlace a `/forgot-password` en cualquier error del backend (token inválido/expirado).

#### Escenario: Flujo de restablecimiento de contraseña exitoso (frontend)

- **DADO** que un Visitante navega a `/reset-password?token=abc123`
- **Y** introduce `NewPass123!` en ambos campos de contraseña
- **CUANDO** se envía el formulario
- **ENTONCES** se llama a `api.post('/auth/reset-password', { token: 'abc123', password: 'NewPass123!' })`
- **Y** al recibir `200 OK` se muestra un toast de éxito con `t("messages.passwordResetSuccess")`
- **Y** la SPA navega a `/login`

#### Escenario: Contraseñas no coinciden (validación en cliente)

- **DADO** que un Visitante introduce `Pass1234!` en el primer campo y `Diferente!` en el segundo
- **CUANDO** se envía el formulario
- **ENTONCES** no se hace ninguna llamada a la API
- **Y** se muestra un error en línea (las contraseñas no coinciden)

#### Escenario: Contraseña demasiado corta (validación en cliente)

- **DADO** que un Visitante introduce `corta` en ambos campos de contraseña
- **CUANDO** se envía el formulario
- **ENTONCES** no se hace ninguna llamada a la API
- **Y** se muestra un error en línea (mínimo 8 caracteres)

#### Escenario: El backend devuelve error de token inválido

- **DADO** que el backend devuelve `400 Bad Request` para el token
- **CUANDO** se envía el formulario
- **ENTONCES** se muestra un mensaje de error con `t("auth.resetTokenInvalid")`
- **Y** se muestra un enlace a `/forgot-password`

#### Escenario: La ruta ResetPassword es pública

- **DADO** que un Visitante (sin JWT en localStorage) navega a `/reset-password?token=abc`
- **CUANDO** la página renderiza
- **ENTONCES** se muestra el formulario de restablecimiento (sin redirección a `/login` — no envuelto por `ProtectedRoute`)

### Requisito: Claves i18n para la UI de restablecimiento de contraseña

Todas las cadenas visibles por el usuario en las páginas `ForgotPassword` y `ResetPassword` DEBEN existir en `ca.json`, `es.json` y `en.json`. Las cadenas en catalán son los valores canónicos; inglés y español son traducciones.

#### Escenario: Claves i18n presentes en todos los idiomas

- **DADO** que la build está completa
- **CUANDO** se inspeccionan los archivos i18n
- **ENTONCES** las siguientes claves existen en los tres archivos de idioma bajo `auth.*` o `messages.*`:
  - `auth.resetPassword`
  - `auth.newPassword`
  - `auth.confirmPassword`
  - `auth.resetPasswordButton`
  - `auth.resetTokenInvalid`
  - `auth.requestNewReset`
  - `messages.resetEmailSent`
  - `messages.passwordResetSuccess`

#### Escenario: Cambio de idioma en la página de restablecimiento

- **DADO** que un Visitante está en `/reset-password?token=...` con el idioma establecido a `es`
- **CUANDO** la página renderiza
- **ENTONCES** todas las etiquetas, placeholders y texto de botones se muestran en español

### Requisito: Variables de entorno para la configuración del correo

Toda la configuración relacionada con el correo DEBE proporcionarse mediante variables de entorno. Las variables DEBEN estar documentadas en `.env.example` en la raíz del repositorio y en `src/back/.env.example`. En producción el secreto `ENV_FILE` de GitHub Actions las inyecta. En desarrollo no son necesarias (se usa Ethereal en su lugar).

#### Escenario: .env.example contiene todas las claves de correo requeridas

- **DADO** que un desarrollador clona el repositorio
- **CUANDO** inspecciona `.env.example`
- **ENTONCES** las siguientes claves están presentes con valores de ejemplo:
  - `MAIL_USER`
  - `MAIL_OAUTH_CLIENT_ID`
  - `MAIL_OAUTH_CLIENT_SECRET`
  - `MAIL_OAUTH_REFRESH_TOKEN`
  - `FRONTEND_URL`
  - `RESET_TOKEN_EXPIRY_MINUTES`

#### Escenario: El desarrollo funciona sin variables de entorno de correo

- **DADO** que `NODE_ENV` no es `production` y las variables `MAIL_*` no están definidas
- **CUANDO** el backend arranca y se llama a `POST /auth/forgot-password` con un email conocido
- **ENTONCES** el backend no falla
- **Y** se loguea una URL de previsualización de Ethereal en la consola
