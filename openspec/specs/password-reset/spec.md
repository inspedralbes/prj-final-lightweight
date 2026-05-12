# Especificació: Restabliment de Contrasenya (Forgot-Password)

## Propòsit

Defineix els requisits funcionals per al flux complet de restabliment de contrasenya, incloent l'endpoint de sol·licitud de restabliment, l'endpoint de confirmació, el model de persistència de tokens, el servei de correu electrònic, les pàgines frontend i el suport d'internacionalització. Implementat en LW-453.

## Requisits

### Requisit: Endpoint de forgot-password

El sistema DEBE exponer `POST /auth/forgot-password` que acepta una dirección de email, la busca en la base de datos y — si la encuentra — genera un token de restablecimiento seguro de un solo uso, persiste su hash SHA-256 en `PasswordResetToken` y envía un enlace de restablecimiento al email registrado. La respuesta DEBE ser siempre `200 OK` con un mensaje genérico independientemente de si el email existe, para prevenir la enumeración de emails. El endpoint DEBE estar limitado a 3 peticiones por minuto por IP mediante `@nestjs/throttler`.

#### Escenari: El email existeix — token creat i email enviat

- **DONAT** que existeix un usuari registrat amb email `user@example.com` a la base de dades
- **QUAN** un Visitant fa POST a `/auth/forgot-password` amb `{ "email": "user@example.com" }`
- **ALESHORES** la resposta és `200 OK` amb body `{ "message": "If this email exists, a reset link has been sent." }`
- **I** es crea una fila `PasswordResetToken` amb `userId` corresponent a l'usuari, `used = false` i `expiresAt` aproximadament 30 minuts des d'ara
- **I** el camp `token` emmagatzemat és el hex SHA-256 del token en brut (no el token en brut)
- **I** s'envia un email a `user@example.com` amb una URL de la forma `${FRONTEND_URL}/reset-password?token=<raw-token>`

#### Escenari: El email no existeix — sense filtració

- **DONAT** que no existeix cap usuari amb email `unknown@example.com`
- **QUAN** un Visitant fa POST a `/auth/forgot-password` amb `{ "email": "unknown@example.com" }`
- **ALESHORES** la resposta és `200 OK` amb el mateix body genèric
- **I** no es crea cap fila `PasswordResetToken`
- **I** no s'envia cap email

#### Escenari: Límit de taxa superat

- **DONAT** que un Visitant ja ha enviat 3 peticions a `POST /auth/forgot-password` en 60 segons des de la mateixa IP
- **QUAN** la mateixa IP envia una 4a petició en el mateix minut
- **ALESHORES** la resposta és `429 Too Many Requests`

#### Escenari: Format d'email invàlid

- **QUAN** un Visitant fa POST a `/auth/forgot-password` amb `{ "email": "no-es-un-email" }`
- **ALESHORES** la resposta és `400 Bad Request` del `ValidationPipe` global (class-validator `@IsEmail()`)

#### Escenari: El token pendent existent s'invalida en tornar a sol·licitar

- **DONAT** que un usuari ja té un `PasswordResetToken` no expirat i no usat a la base de dades
- **QUAN** el mateix usuari sol·licita exitosament un nou restabliment
- **ALESHORES** el token antic es marca com a `used = true` abans de crear el nou
- **I** només l'enllaç del nou token és vàlid

---

### Requisit: Endpoint de reset-password

El sistema DEBE exponer `POST /auth/reset-password` que acepta un token de restablecimiento en bruto y una nueva contraseña. El endpoint DEBE validar el token (coincidencia de hash, `used = false`, `expiresAt > now()`), actualizar el `passwordHash` del usuario con bcrypt (10 rondas) y marcar el token como consumido. En cualquier fallo de validación la respuesta DEBE ser `400 Bad Request` con el mensaje `"Invalid or expired token"`. En caso de éxito la respuesta es `200 OK`.

#### Escenari: Restabliment de contrasenya exitós

- **DONAT** un `PasswordResetToken` vàlid, no expirat i no usat per a l'usuari `user@example.com`
- **I** el frontend té el token en brut de l'enllaç de l'email
- **QUAN** un Visitant fa POST a `/auth/reset-password` amb `{ "token": "<raw>", "password": "NewPass123!" }`
- **ALESHORES** la resposta és `200 OK` amb body `{ "message": "Password reset successfully." }`
- **I** `User.passwordHash` s'actualitza a `bcrypt.hash("NewPass123!", 10)`
- **I** `PasswordResetToken.used` s'estableix a `true`
- **I** l'usuari pot iniciar sessió amb `NewPass123!` via `POST /auth/login`

#### Escenari: Token expirat

- **DONAT** que existeix un `PasswordResetToken` amb `expiresAt` en el passat
- **QUAN** un Visitant fa POST a `/auth/reset-password` amb el token en brut associat
- **ALESHORES** la resposta és `400 Bad Request` amb `{ "message": "Invalid or expired token" }`
- **I** la contrasenya de l'usuari no canvia

#### Escenari: Token ja usat

- **DONAT** un `PasswordResetToken` amb `used = true`
- **QUAN** un Visitant fa POST a `/auth/reset-password` amb el token en brut associat
- **ALESHORES** la resposta és `400 Bad Request` amb `{ "message": "Invalid or expired token" }`

#### Escenari: Token inexistent

- **QUAN** un Visitant fa POST a `/auth/reset-password` amb una cadena arbitrària que no coincideix amb cap hash emmagatzemat
- **ALESHORES** la resposta és `400 Bad Request` amb `{ "message": "Invalid or expired token" }`

#### Escenari: Nova contrasenya massa curta

- **QUAN** un Visitant fa POST a `/auth/reset-password` amb un token vàlid i `"password": "curta"` (menys de 8 caràcters)
- **ALESHORES** la resposta és `400 Bad Request` del `ValidationPipe` (class-validator `@MinLength(8)`)

---

### Requisit: Model Prisma PasswordResetToken

El sistema DEBE persistir los tokens de restablecimiento en una nueva tabla `password_reset_tokens` a través del modelo Prisma `PasswordResetToken`. El campo `token` DEBE almacenar el hash hex SHA-256 del token en bruto (nunca el token en bruto). El modelo DEBE eliminar en cascada cuando el `User` padre se elimine.

#### Escenari: Token eliminat quan s'elimina l'usuari

- **DONAT** que un usuari té una o més files `PasswordResetToken`
- **QUAN** la fila de l'usuari s'elimina de la base de dades (p. ex., eliminació de compte)
- **ALESHORES** totes les files `PasswordResetToken` associades s'eliminen en cascada (`onDelete: Cascade`)

#### Escenari: Unicitat del token

- **DONAT** que un token en brut es genera com a `crypto.randomBytes(32).toString('hex')`
- **QUAN** el seu hash SHA-256 s'emmagatzema a `PasswordResetToken.token`
- **ALESHORES** una restricció `@unique` a `token` evita dues files amb el mateix hash

---

### Requisit: MailService — Nodemailer amb transport adaptat a l'entorn

El sistema DEBE proporcionar un `MailService` (en `src/back/src/mail/`) que envíe emails transaccionales via Nodemailer. En producción (`NODE_ENV=production`) DEBE usar credenciales Gmail OAuth2 obtenidas de las variables de entorno. En todos los demás entornos DEBE crear automáticamente una cuenta de prueba Ethereal y loguear la URL de previsualización en la consola. El servicio DEBE ser inyectable y mockeable mediante un token de proveedor de NestJS.

#### Escenari: Email enviat en producció amb Gmail OAuth2

- **DONAT** que `NODE_ENV=production` i `MAIL_USER`, `MAIL_OAUTH_CLIENT_ID`, `MAIL_OAUTH_CLIENT_SECRET`, `MAIL_OAUTH_REFRESH_TOKEN` estan definits
- **QUAN** es crida a `MailService.sendPasswordReset(email, resetLink)`
- **ALESHORES** un transport Nodemailer amb `{ service: 'gmail', auth: { type: 'OAuth2', ... } }` lliura l'email al destinatari
- **I** no es crea cap compte Ethereal

#### Escenari: Email enviat en desenvolupament amb Ethereal

- **DONAT** que `NODE_ENV` no és `production`
- **QUAN** es crida a `MailService.sendPasswordReset(email, resetLink)`
- **ALESHORES** s'usa un transport Ethereal de Nodemailer (compte de prova creat automàticament)
- **I** la URL de previsualització d'Ethereal (`nodemailer.getTestMessageUrl(info)`) es registra amb `console.log`
- **I** no es requereixen credencials Gmail

#### Escenari: Testabilitat — MailService és mockeable

- **DONAT** un test unitari Vitest/Jest per a `AuthService`
- **QUAN** el `TestingModule` es construeix amb `overrideProvider(MailService).useValue({ sendPasswordReset: vi.fn() })`
- **ALESHORES** `AuthService.forgotPassword()` pot testejar-se sense cap connexió SMTP

---

### Requisit: Pàgina frontend ForgotPassword — crida real a la API

La página `ForgotPassword` de la SPA en `/forgot-password` DEBE llamar a `POST /auth/forgot-password` con el email enviado en lugar de simular el éxito. El formulario DEBE deshabilitar el botón de envío mientras la petición está en vuelo. Si el backend devuelve error (email no registrado), DEBE mostrarse un mensaje de error en línea bajo el campo email. En caso de éxito DEBE mostrarse un toast y redirigir a `/login` tras ~2 segundos.

#### Escenari: Email enviat — ruta d'èxit

- **DONAT** que un Visitant és a `/forgot-password`
- **QUAN** l'usuari introdueix un email registrat i envia el formulari
- **ALESHORES** es crida a `api.post('/auth/forgot-password', { email })`
- **I** el botó d'enviament es deshabilita mentre la petició està pendent
- **I** en rebre `200 OK` es mostra un toast d'èxit amb `t("messages.resetEmailSent")`
- **I** després de 2 segons la SPA navega a `/login`

#### Escenari: Email no registrat — error visible

- **DONAT** que un Visitant introdueix un email que no existeix a la base de dades
- **QUAN** envia el formulari
- **ALESHORES** el backend retorna `404 Not Found`
- **I** es mostra un error en línia amb `t("auth.emailNotRegistered")` sota el camp email
- **I** no es redirigeix a `/login`

#### Escenari: Error de xarxa

- **DONAT** que el backend no està disponible
- **QUAN** el Visitant envia el formulari
- **ALESHORES** es mostra l'error en línia sota el camp email
- **I** no es redirigeix a `/login`

---

### Requisit: Pàgina frontend ResetPassword

La SPA DEBE exponer una nueva página `ResetPassword` en `/reset-password?token=...`. La página DEBE renderizar dos campos de contraseña ("nueva contraseña" + "confirmar contraseña"), validar que coinciden y que cada una tiene al menos 8 caracteres antes de llamar al backend, llamar a `POST /auth/reset-password` con el token de la cadena de consulta y la nueva contraseña, mostrar un toast de éxito y redirigir a `/login` en caso de éxito, y mostrar un mensaje de error con un enlace a `/forgot-password` en cualquier error del backend (token inválido/expirado).

#### Escenari: Flux de restabliment de contrasenya exitós (frontend)

- **DONAT** que un Visitant navega a `/reset-password?token=abc123`
- **I** introdueix `NewPass123!` en tots dos camps de contrasenya
- **QUAN** s'envia el formulari
- **ALESHORES** es crida a `api.post('/auth/reset-password', { token: 'abc123', password: 'NewPass123!' })`
- **I** en rebre `200 OK` es mostra un toast d'èxit amb `t("messages.passwordResetSuccess")`
- **I** la SPA navega a `/login`

#### Escenari: Les contrasenyes no coincideixen (validació al client)

- **DONAT** que un Visitant introdueix `Pass1234!` al primer camp i `Diferente!` al segon
- **QUAN** s'envia el formulari
- **ALESHORES** no es fa cap crida a la API
- **I** es mostra un error en línia (les contrasenyes no coincideixen)

#### Escenari: Contrasenya massa curta (validació al client)

- **DONAT** que un Visitant introdueix `curta` en tots dos camps de contrasenya
- **QUAN** s'envia el formulari
- **ALESHORES** no es fa cap crida a la API
- **I** es mostra un error en línia (mínim 8 caràcters)

#### Escenari: El backend retorna error de token invàlid

- **DONAT** que el backend retorna `400 Bad Request` per al token
- **QUAN** s'envia el formulari
- **ALESHORES** es mostra un missatge d'error amb `t("auth.resetTokenInvalid")`
- **I** es mostra un enllaç a `/forgot-password`

#### Escenari: La ruta ResetPassword és pública

- **DONAT** que un Visitant (sense JWT a localStorage) navega a `/reset-password?token=abc`
- **QUAN** la pàgina renderitza
- **ALESHORES** es mostra el formulari de restabliment (sense redirecció a `/login` — no embolicat per `ProtectedRoute`)

---

### Requisit: Claus i18n per a la UI de restabliment de contrasenya

Totes les cadenes visibles per l'usuari a les pàgines `ForgotPassword` i `ResetPassword` DEBEN existir a `ca.json`, `es.json` i `en.json`. Les cadenes en català són els valors canònics; anglès i espanyol són traduccions.

#### Escenari: Claus i18n presents en tots els idiomes

- **DONAT** que la build està completa
- **QUAN** s'inspeccionen els fitxers i18n
- **ALESHORES** les següents claus existeixen als tres fitxers d'idioma sota `auth.*` o `messages.*`:
  - `auth.resetPassword`
  - `auth.newPassword`
  - `auth.confirmPassword`
  - `auth.resetPasswordButton`
  - `auth.resetTokenInvalid`
  - `auth.requestNewReset`
  - `messages.resetEmailSent`
  - `messages.passwordResetSuccess`

#### Escenari: Canvi d'idioma a la pàgina de restabliment

- **DONAT** que un Visitant és a `/reset-password?token=...` amb l'idioma establert a `es`
- **QUAN** la pàgina renderitza
- **ALESHORES** totes les etiquetes, placeholders i text de botons es mostren en espanyol

---

### Requisit: Variables d'entorn per a la configuració del correu

Tota la configuració relacionada amb el correu DEBE proporcionarse mediante variables de entorno. Las variables DEBEN estar documentadas en `.env.example` en la raíz del repositorio y en `src/back/.env.example`. En producción el secreto `ENV_FILE` de GitHub Actions las inyecta. En desarrollo no son necesarias (se usa Ethereal en su lugar).

#### Escenari: .env.example conté totes les claus de correu requerides

- **DONAT** que un desenvolupador clona el repositori
- **QUAN** inspecciona `.env.example`
- **ALESHORES** les següents claus estan presents amb valors d'exemple:
  - `MAIL_USER`
  - `MAIL_OAUTH_CLIENT_ID`
  - `MAIL_OAUTH_CLIENT_SECRET`
  - `MAIL_OAUTH_REFRESH_TOKEN`
  - `FRONTEND_URL`
  - `RESET_TOKEN_EXPIRY_MINUTES`

#### Escenari: El desenvolupament funciona sense variables d'entorn de correu

- **DONAT** que `NODE_ENV` no és `production` i les variables `MAIL_*` no estan definides
- **QUAN** el backend arrenca i es crida a `POST /auth/forgot-password` amb un email conegut
- **ALESHORES** el backend no falla
- **I** es registra una URL de previsualització d'Ethereal a la consola
