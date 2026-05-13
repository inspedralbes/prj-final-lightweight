# Auth Capability

## Purpose

The auth capability covers user authentication flows: login (credential validation, JWT issuance) and logout (session release). It includes single-session enforcement so that only one active session per user is permitted at a time.

---

## Requirements

### Requirement: Login com a usuari registrat

El sistema HA DE permetre a un usuari registrat iniciar sessió amb el seu nom d'usuari i contrasenya. Després del login exitós, l'usuari HA DE rebre un token JWT, tenir-lo emmagatzemat a localStorage i ser redirigit al seu dashboard específic del rol. **El sistema HA DE rebutjar el login si l'usuari ja té una sessió activa en un altre dispositiu o navegador.**

#### Scenario: Login exitós com a COACH sense sessió activa prèvia

- **QUAN** un usuari COACH omple el nom d'usuari i la contrasenya amb les credencials correctes i no hi ha cap sessió activa al servidor
- **ALESHORES** el sistema valida les credencials, retorna HTTP 200 amb `access_token` i objecte d'usuari, emmagatzema el token a localStorage, estableix AuthContext, redirigeix a /dashboard i mostra notificació d'èxit

#### Scenario: Login exitós com a CLIENT sense sessió activa prèvia

- **QUAN** un usuari CLIENT omple el nom d'usuari i la contrasenya correctes i no hi ha sessió activa
- **ALESHORES** el sistema retorna HTTP 200 amb `access_token`, emmagatzema el token a localStorage, estableix AuthContext i redirigeix a /client-home

#### Scenario: Login rebutjat per sessió activa existent

- **QUAN** un usuari intenta iniciar sessió des d'un segon navegador o dispositiu mentre ja té una sessió activa
- **ALESHORES** el sistema retorna HTTP 409 amb missatge localitzat (`auth.errors.sessionAlreadyActive`), no emmagatzema cap token nou i l'usuari roman a la pàgina de login

#### Scenario: Login amb credencials incorrectes

- **QUAN** un usuari omple un nom d'usuari vàlid i una contrasenya incorrecta
- **ALESHORES** el sistema retorna HTTP 401 amb missatge "Credencials incorrectes" i no modifica `activeSessionToken`

---

### Requirement: Logout allibera la sessió al servidor

El sistema HA DE proporcionar un endpoint `POST /api/auth/logout` protegit per JWT. En cridar-lo, el sistema HA DE esborrar el token de sessió activa de l'usuari a la base de dades, permetent que el compte torni a estar disponible per a login.

#### Scenario: Logout exitós per a usuari autenticat

- **QUAN** un usuari autenticat fa `POST /api/auth/logout` amb un JWT vàlid a la capçalera Authorization
- **ALESHORES** el sistema retorna HTTP 200 `{ "message": "Logged out" }`, `activeSessionToken` es posa a null a la BD, i el compte queda disponible per a un nou login

#### Scenario: Logout sense token JWT

- **QUAN** es fa `POST /api/auth/logout` sense capçalera Authorization
- **ALESHORES** el sistema retorna HTTP 401 Unauthorized

#### Scenario: El frontend invoca logout al servidor abans de netejar localStorage

- **QUAN** l'usuari fa clic al botó de tancar sessió
- **ALESHORES** el frontend crida `POST /api/auth/logout`, espera la resposta, i posteriorment neteja localStorage i redirigeix a /login (en cas d'error de xarxa, continua amb la neteja local igualment)
