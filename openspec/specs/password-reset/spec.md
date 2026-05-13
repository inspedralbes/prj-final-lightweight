# Especificació: Restabliment de Contrasenya (Forgot-Password)

## Propòsit

Defineix els requisits funcionals per al flux complet de restabliment de contrasenya, incloent l'endpoint de sol·licitud de restabliment, l'endpoint de confirmació, el model de persistència de tokens, el servei de correu electrònic, les pàgines frontend i el suport d'internacionalització. Implementat en LW-453.

## Requisits

### Requisit: Endpoint de forgot-password

El sistema HA D'exposar `POST /auth/forgot-password` que accepta una adreça d'email, la busca a la base de dades i — si la troba — genera un token de restabliment segur d'un sol ús, persisteix el seu hash SHA-256 a `PasswordResetToken` i envia un enllaç de restabliment a l'email registrat. La resposta HA DE ser sempre `200 OK` amb un missatge genèric independentment de si l'email existeix, per prevenir l'enumeració d'emails. L'endpoint HA D'estar limitat a 3 peticions per minut per IP mitjançant `@nestjs/throttler`.

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

El sistema HA D'exposar `POST /auth/reset-password` que accepta un token de restabliment en brut i una nova contrasenya. L'endpoint HA DE validar el token (coincidència de hash, `used = false`, `expiresAt > now()`), actualitzar el `passwordHash` de l'usuari amb bcrypt (10 rondes) i marcar el token com a consumit. En qualsevol falla de validació la resposta HA DE ser `400 Bad Request` amb el missatge `"Invalid or expired token"`. En cas d'èxit la resposta és `200 OK`.

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

El sistema HA DE persistir els tokens de restabliment en una nova taula `password_reset_tokens` a través del model Prisma `PasswordResetToken`. El camp `token` HA D'emmagatzemar el hash hex SHA-256 del token en brut (mai el token en brut). El model HA D'eliminar en cascada quan l'`User` pare s'elimini.

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

El sistema HA DE proporcionar un `MailService` (a `src/back/src/mail/`) que enviï emails transaccionals via Nodemailer. En producció (`NODE_ENV=production`) HA D'usar credencials Gmail OAuth2 obtingudes de les variables d'entorn. En tots els altres entorns HA DE crear automàticament un compte de prova Ethereal i registrar la URL de previsualització a la consola. El servei HA DE ser injectable i mockejable mitjançant un token de proveïdor de NestJS.

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

La pàgina `ForgotPassword` de la SPA a `/forgot-password` HA DE cridar `POST /auth/forgot-password` amb l'email enviat en lloc de simular l'èxit. El formulari HA DE deshabilitar el botó d'enviament mentre la petició és en vol. Si el backend retorna error (email no registrat), HA DE mostrar-se un missatge d'error en línia sota el camp email. En cas d'èxit HA DE mostrar-se un toast i redirigir a `/login` després de ~2 segons.

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

La SPA HA D'exposar una nova pàgina `ResetPassword` a `/reset-password?token=...`. La pàgina HA DE renderitzar dos camps de contrasenya ("nova contrasenya" + "confirmar contrasenya"), validar que coincideixen i que cadascuna té almenys 8 caràcters abans de cridar el backend, cridar `POST /auth/reset-password` amb el token de la cadena de consulta i la nova contrasenya, mostrar un toast d'èxit i redirigir a `/login` en cas d'èxit, i mostrar un missatge d'error amb un enllaç a `/forgot-password` en qualsevol error del backend (token invàlid/expirat).

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

Totes les cadenes visibles per l'usuari a les pàgines `ForgotPassword` i `ResetPassword` HAN D'existir a `ca.json`, `es.json` i `en.json`. Les cadenes en català són els valors canònics; anglès i espanyol són traduccions.

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

Tota la configuració relacionada amb el correu HA DE proporcionar-se mitjançant variables d'entorn. Les variables HAN D'estar documentades a `.env.example` a l'arrel del repositori i a `src/back/.env.example`. En producció el secret `ENV_FILE` de GitHub Actions les injecta. En desenvolupament no són necessàries (s'usa Ethereal en el seu lloc).

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

---

### Requisit: Tests unitaris d'AuthService.forgotPassword

La suite de tests unitaris per a `AuthService.forgotPassword` HA DE cobrir tots els escenaris normatius definits a `openspec/specs/password-reset/spec.md` usant Vitest + NestJS `TestingModule`. `PrismaService`, `MailService` i `ConfigService` HAN DE ser injectats com a mocks. No s'ha de fer cap connexió real a BD ni SMTP.

#### Escenari: Email conegut — token creat i email enviat

- **DONAT** `prismaMock.user.findUnique` retorna un usuari amb `id: 1, email: 'user@example.com'`
- **I** `prismaMock.passwordResetToken.updateMany` resol (marca els tokens antics com a usats)
- **I** `prismaMock.passwordResetToken.create` resol
- **QUAN** es crida `service.forgotPassword({ email: 'user@example.com' })`
- **ALESHORES** `prismaMock.passwordResetToken.updateMany` es crida una vegada amb `{ where: { userId: 1, used: false }, data: { used: true } }`
- **I** `prismaMock.passwordResetToken.create` es crida una vegada amb un objecte `data` que conté `userId: 1`, una cadena `token` (SHA-256 hex de 64 caràcters), i una `expiresAt` Date aproximadament 30 minuts en el futur
- **I** `mailMock.sendPasswordReset` es crida una vegada amb `'user@example.com'` i una URL que conté `/reset-password?token=`

#### Escenari: Email desconegut — NotFoundException llançada

- **DONAT** `prismaMock.user.findUnique` retorna `null`
- **QUAN** es crida `service.forgotPassword({ email: 'unknown@example.com' })`
- **ALESHORES** la promesa rebutja amb `NotFoundException`
- **I** `prismaMock.passwordResetToken.create` NO es crida
- **I** `mailMock.sendPasswordReset` NO es crida

#### Escenari: Token no usat existent invalidat abans de crear-ne un de nou

- **DONAT** un usuari té un token no usat existent a la BD
- **QUAN** es crida `service.forgotPassword` per a aquell usuari
- **ALESHORES** `prismaMock.passwordResetToken.updateMany` es crida ABANS de `prismaMock.passwordResetToken.create`

#### Escenari: L'expiració del token usa el valor de configuració RESET_TOKEN_EXPIRY_MINUTES

- **DONAT** `ConfigService.get('RESET_TOKEN_EXPIRY_MINUTES')` retorna `'60'`
- **QUAN** es crida `service.forgotPassword` amb un email conegut
- **ALESHORES** l'`expiresAt` passat a `passwordResetToken.create` és aproximadament 60 minuts a partir de `Date.now()`

#### Escenari: Testabilitat — MailService injectat com a mock

- **DONAT** el `TestingModule` usa `overrideProvider(MailService).useValue({ sendPasswordReset: vi.fn() })`
- **QUAN** `service.forgotPassword` es completa
- **ALESHORES** no s'intenta cap connexió SMTP real i el test passa

---

### Requisit: Tests unitaris d'AuthService.resetPassword

La suite de tests unitaris per a `AuthService.resetPassword` HA DE verificar la validació del token, l'actualització de contrasenya i el consum del token usant Vitest + Prisma mockat. Les assertes sensibles al temps HAN D'usar `vi.useFakeTimers()` / `vi.setSystemTime()`.

#### Escenari: Token vàlid — contrasenya actualitzada i token marcat com a usat

- **DONAT** `prismaMock.passwordResetToken.findFirst` retorna `{ id: 10, userId: 1, used: false, expiresAt: <data futura> }`
- **I** `prismaMock.user.update` resol
- **I** `prismaMock.passwordResetToken.update` resol
- **QUAN** es crida `service.resetPassword({ token: '<raw>', password: 'NewPass123!' })`
- **ALESHORES** `prismaMock.user.update` es crida amb `{ where: { id: 1 }, data: { passwordHash: expect.any(String) } }`
- **I** `prismaMock.passwordResetToken.update` es crida amb `{ where: { id: 10 }, data: { used: true } }`

#### Escenari: Token no trobat — BadRequestException llançada

- **DONAT** `prismaMock.passwordResetToken.findFirst` retorna `null`
- **QUAN** es crida `service.resetPassword({ token: 'invalid', password: 'NewPass123!' })`
- **ALESHORES** la promesa rebutja amb `BadRequestException` i el missatge `'Invalid or expired token'`
- **I** `prismaMock.user.update` NO es crida

#### Escenari: Token expirat — BadRequestException llançada

- **DONAT** `vi.setSystemTime` s'usa per establir el temps actual més tard que l'`expiresAt` del token
- **I** `prismaMock.passwordResetToken.findFirst` retorna `null` (el filtre Prisma sobre `expiresAt: { gt: new Date() }` no retorna res)
- **QUAN** es crida `service.resetPassword`
- **ALESHORES** la promesa rebutja amb `BadRequestException` i el missatge `'Invalid or expired token'`

#### Escenari: Token ja usat — BadRequestException llançada

- **DONAT** la BD té un token amb `used: true`
- **I** `prismaMock.passwordResetToken.findFirst` retorna `null` (el filtre Prisma sobre `used: false` l'exclou)
- **QUAN** es crida `service.resetPassword` amb el token en brut coincident
- **ALESHORES** la promesa rebutja amb `BadRequestException` i el missatge `'Invalid or expired token'`

#### Escenari: Token emmagatzemat com a hash SHA-256 del valor en brut

- **DONAT** `prismaMock.passwordResetToken.findFirst` s'ha configurat per capturar l'argument `where`
- **QUAN** es crida `service.resetPassword({ token: 'abc123', password: 'NewPass123!' })`
- **ALESHORES** el `where.token` passat a `findFirst` és igual a `sha256('abc123')` (hex de 64 caràcters)

#### Escenari: Contrasenya actualitzada amb bcrypt 10 rondes

- **DONAT** un registre de token vàlid és retornat per `findFirst`
- **QUAN** `service.resetPassword` es completa amb èxit
- **ALESHORES** `prismaMock.user.update` es crida amb `data.passwordHash` que és un hash bcrypt vàlid (comença amb `$2b$10$`)
