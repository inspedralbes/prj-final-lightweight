# Planificació del Projecte — LightWeight

## Informació General

| Camp                | Valor                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| Projecte            | LightWeight — Plataforma de fitness per entrenadors personals                           |
| Gestió de tasques   | Jira (lightweight-fitness.atlassian.net · Projecte LW)                                  |
| Control de versions | GitHub (branques `dev` i `main`, PR amb revisió obligatòria)                            |
| Metodologia         | Agile/Scrum amb Sprints setmanals → Spec-Driven Development (SDD) a partir del Sprint 3 |
| Durada total        | 09/02/2026 – 15/05/2026 (4 sprints)                                                     |

## Equip

| Membre  | Rol principal                   |
| ------- | ------------------------------- |
| Brian   | Frontend / Full-stack           |
| Valeria | Backend / DevOps / Documentació |
| Amin    | Frontend / UI/UX                |
| David   | Backend / Base de dades         |

---

## Sprint 1 — Fonaments i Autenticació

**Dates:** 09/02/2026 – 18/02/2026  
**Epic principal:** LW-5 — Autenticació Coach i Infraestructura Web SPA

### Objectius

- Definir i consolidar l'arquitectura del projecte, el flux de pantalles i les tecnologies a utilitzar.
- Dissenyar i validar els mockups de l'aplicació, evolucionant des d'idees inicials fins a un disseny proper a la versió final.
- Establir l'organització de l'equip amb Jira i GitHub.
- Configurar l'entorn tècnic: Docker, PostgreSQL i estructura backend amb NestJS.
- Implementar el sistema d'autenticació bàsic (registre i login) amb JWT i bcrypt.
- Integrar la connexió frontend–backend mitjançant peticions HTTP.
- Desenvolupar les primeres funcionalitats clau: login funcional i CRUD inicial.
- Resoldre errors inicials i refinar tasques per facilitar el treball en equip.

### Tasques per membre

#### Brian

| Clau   | Descripció                                       |
| ------ | ------------------------------------------------ |
| LW-10  | Configurar variables d'entorn (BD i JWT secret)  |
| LW-11  | Configurar port backend 3000                     |
| LW-19  | Crear DTO register                               |
| LW-32  | Configurar Axios per al backend (localhost:3000) |
| LW-41  | Emmagatzemar JWT al localStorage                 |
| LW-42  | Redirigir al dashboard després del login         |
| LW-300 | Crear DTO login                                  |
| LW-304 | Crear formulari login (username, password)       |
| LW-306 | Crear formulari register (username, password)    |

#### Valeria

| Clau   | Descripció                                             |
| ------ | ------------------------------------------------------ |
| LW-7   | Instal·lar i configurar NestJS amb TypeScript          |
| LW-18  | Crear servei Auth (hash password amb bcrypt)           |
| LW-20  | Implementar endpoint POST /auth/register               |
| LW-22  | Implementar POST /auth/login                           |
| LW-23  | Generar JWT amb userId i role                          |
| LW-24  | Crear guard/middleware JWT                             |
| LW-25  | Extreure role des del token                            |
| LW-28  | Inicialitzar projecte Vite + React + TypeScript        |
| LW-299 | Implementar validació de credencials                   |
| LW-301 | Crear user amb role COACH i CLIENT                     |
| LW-303 | Instal·lar i configurar Tailwind CSS                   |
| LW-307 | Configurar sistema de navegació SPA                    |
| LW-309 | Implementar persistència de sessió amb JWT             |
| LW-366 | Implementar logout (esborrar JWT i redirigir a /login) |

#### Amin

| Clau   | Descripció                                  |
| ------ | ------------------------------------------- |
| LW-12  | Verificar connexió a base de dades          |
| LW-21  | Validar unicitat de username en register    |
| LW-30  | Configurar estructura SPA responsive        |
| LW-31  | Crear pàgina login bàsica                   |
| LW-33  | Configurar React Router                     |
| LW-40  | Gestionar resposta login exitosa            |
| LW-43  | Gestionar resposta login amb error          |
| LW-44  | Crear ProtectedRoute per a rutes privades   |
| LW-45  | Protegir rutes del coach                    |
| LW-46  | Preparar ruta pública /session/:code        |
| LW-305 | Crear pàgina Register bàsica                |
| LW-342 | Fer mockup de login                         |
| LW-365 | Instal·lar i configurar Toast notifications |
| LW-376 | Implementar i18n per idiomes                |

#### David

| Clau   | Descripció                                              |
| ------ | ------------------------------------------------------- |
| LW-8   | Configurar Prisma amb PostgreSQL                        |
| LW-14  | Definir schema Prisma per al model User                 |
| LW-15  | Configurar username únic                                |
| LW-16  | Configurar camp createdAt                               |
| LW-29  | Configurar port 5173                                    |
| LW-47  | Crear estructura bàsica de mòduls (auth, user, session) |
| LW-295 | Configurar camp id autoincremental                      |
| LW-296 | Configurar passwordHash                                 |
| LW-297 | Configurar enum Role amb valor COACH                    |
| LW-298 | Executar migració inicial                               |

### Revisió del Sprint

> Durant aquest sprint es van establir les bases del projecte. Es va definir l'arquitectura, les tecnologies i el flux de pantalles, així com els primers dissenys mitjançant mockups. També es va organitzar l'equip i les tasques amb eines com Jira i GitHub.
>
> A nivell tècnic, es va configurar l'entorn de desenvolupament (Docker, base de dades i backend amb NestJS) i es va implementar una primera versió funcional del sistema d'autenticació amb registre i login. Tot i alguns ajustos i canvis en l'abast inicial, es van complir els objectius principals i es va aconseguir una base sòlida per continuar el desenvolupament.

---

## Sprint 2 — Gestió de Rutines, Clients i Deployment

**Dates:** 19/02/2026 – 28/02/2026  
**Epics principals:**

- LW-48 — Dashboard Coach amb Llista i Editor de Rutines
- LW-81 — Invitació i Perfil de Clients
- LW-124 — Sistema de Friend Session en Temps Real (inici)
- LW-383 — Deployment Continu

### Objectius

- Desenvolupar les funcionalitats principals de gestió de rutines (creació, edició, assignació i eliminació).
- Implementar la interacció coach–client, incloent assignació de rutines i visualització per rols.
- Integrar i millorar la connexió amb APIs externes (exercicis) i la seva persistència a la base de dades.
- Completar el sistema de sessions compartides (rooms), incloent accés per codi i selecció de rutines pel host.
- Implementar funcionalitats en temps real amb el xat (WebSockets).
- Millorar i estabilitzar el frontend (disseny, UX, errors visuals i i18n).
- Optimitzar el backend (refactorització, eliminació de codi duplicat i millora de l'estructura).
- Assegurar la qualitat del codi mitjançant resolució de bugs, control de merges i estabilització de la branca dev.
- Avançar en el desplegament i la integració contínua de l'aplicació.

### Tasques per membre

#### Brian

| Clau   | Descripció                                                      |
| ------ | --------------------------------------------------------------- |
| LW-67  | Crear pàgina /dashboard                                         |
| LW-68  | Configurar dashboard com a home després del login               |
| LW-69  | Mostrar llista/taula de rutines                                 |
| LW-70  | Mostrar nom de rutina                                           |
| LW-71  | Mostrar nombre d'exercicis                                      |
| LW-72  | Mostrar data de creació                                         |
| LW-100 | Crear ruta /clients/invite                                      |
| LW-101 | Crear pàgina d'invitació                                        |
| LW-102 | Implementar botó "Generar codi"                                 |
| LW-103 | Mostrar codi generat en pantalla                                |
| LW-104 | Implementar botó copiar codi al portapapers                     |
| LW-105 | Mostrar feedback visual al copiar                               |
| LW-106 | Afegir link al sidebar a la pàgina d'invitació                  |
| LW-316 | Implementar botó "Crear Rutina"                                 |
| LW-317 | Implementar acció editar rutina                                 |
| LW-318 | Implementar acció eliminar rutina                               |
| LW-319 | Implementar estat buit (sense rutines)                          |
| LW-322 | Configurar navegació lateral bàsica                             |
| LW-334 | Integrar Axios amb endpoints /routines                          |
| LW-362 | Validar creació d'usuari CLIENT                                 |
| LW-363 | Validar que username segueix sent únic                          |
| LW-368 | Definir comportament FK (onDelete/onUpdate) per Routine.coachId |
| LW-369 | Confirmació d'eliminació (modal/confirm dialog)                 |

#### Valeria

| Clau   | Descripció                                          |
| ------ | --------------------------------------------------- |
| LW-83  | Afegir camp coachId nullable en User                |
| LW-84  | Afegir camp invitationCode únic                     |
| LW-86  | Definir estructura JSON de profile                  |
| LW-87  | Crear migració de base de dades                     |
| LW-88  | Executar migració i validar schema                  |
| LW-90  | Crear endpoint POST /clients/invite                 |
| LW-312 | Protegir endpoints amb JWT guard                    |
| LW-314 | Validar format JSON d'exercises                     |
| LW-315 | Implementar validació de dades en DTO               |
| LW-321 | Implementar error state amb toast                   |
| LW-344 | Definir relació FK User (coach → clients)           |
| LW-356 | Afegir valor CLIENT a l'enum Role                   |
| LW-357 | Afegir camp coachId nullable                        |
| LW-360 | Crear nova migració Prisma                          |
| LW-361 | Verificar integritat referencial                    |
| LW-377 | Invitations — BBDD: schema i migració               |
| LW-378 | Backend: mòdul d'invitacions                        |
| LW-384 | Desplegar infraestructures en VM (Docker + Compose) |
| LW-385 | Crear Dockerfiles i docker-compose de producció     |
| LW-386 | Crear i configurar DNS                              |
| LW-387 | Crear pipeline de desplegament amb GitHub Actions   |

#### Amin

| Clau            | Descripció                                                        |
| --------------- | ----------------------------------------------------------------- |
| LW-74, LW-75    | Crear rutes /routines/create i /routines/:id/edit                 |
| LW-76           | Crear formulari de nom de rutina                                  |
| LW-77–79, 323–325 | Implementar camps de formulari d'exercicis (nom, sets, reps, rest, notes) |
| LW-108, LW-109  | Pàgina /clients — llistat de clients associats del coach          |
| LW-110–113      | Vista de perfil de client (dades, objectius, notes)               |
| LW-114          | Crear endpoint PUT /clients/:id                                   |
| LW-116          | Validar que només el coach pugui editar notes privades             |
| LW-294          | Configurar SocketIO gateway bàsic                                 |
| LW-320          | Implementar loading state                                         |
| LW-326–329      | Botons afegir, eliminar, reordenar i guardar exercici             |
| LW-330–331      | Validació de formulari (nom i mínim 1 exercici obligatoris)       |
| LW-335–337      | Gestió de respostes d'API (success, errors amb toast, loading)    |
| LW-338–340      | Layout responsive amb Tailwind (desktop i mòbil)                  |
| LW-341          | Navegació fluida entre llista i editor de rutines                 |
| LW-345          | Gestionar loading i error states del perfil de client             |
| LW-370          | Refrescar llistat després d'accions CRUD                          |

#### David

| Clau     | Descripció                                                                             |
| -------- | -------------------------------------------------------------------------------------- |
| LW-50    | Crear model Routine en Prisma                                                                          |
| LW-51    | Definir camp id autoincremental                                                                        |
| LW-52    | Definir camp coachId (FK a User)                                                                       |
| LW-53    | Definir camp name                                                                                      |
| LW-54    | Definir camp exercises com a JSON array                                                                |
| LW-55    | Definir camp createdAt                                                                                 |
| LW-56    | Definir estructura JSON exercises (name, sets, reps, rest, notes)                                      |
| LW-57    | Executar migració de base de dades (Routine)                                                           |
| LW-58    | Definir camp updatedAt                                                                                 |
| LW-60    | Crear mòdul Routine en NestJS                                                                          |
| LW-61    | Crear service Routine                                                                                  |
| LW-62    | Crear controller Routine                                                                               |
| LW-63    | Implementar endpoint POST /routines                                                                    |
| LW-64    | Implementar endpoint GET /routines                                                                     |
| LW-65    | Implementar endpoint GET /routines/:id                                                                 |
| LW-310   | Implementar endpoint PUT /routines/:id                                                                 |
| LW-311   | Implementar endpoint DELETE /routines/:id                                                              |
| LW-313   | Validar que rutina pertany al coach autenticat                                                         |

### Revisió del Sprint

> Durant aquest sprint es van completar les funcionalitats principals de gestió de rutines (CRUD complet, editor amb camps d'exercicis i drag & drop). Es va implementar el sistema d'invitació coach–client i la gestió de perfils. Es va iniciar el sistema de Friend Sessions amb WebSockets. Valeria va desplegar la infraestructura completa (VM, Docker, DNS i pipeline de GitHub Actions). Es van estabilitzar les branques dev i main amb el requisit de pull requests aprovats per dos membres.

---

## Sprint 3 — MVP + Transició a SDD

**Dates:**

- **Fase 1 — MVP:** 02/03/2026 – 06/03/2026
- **Fase 2 — SDD i Qualitat:** 20/04/2026 – 01/05/2026

**Epics principals:**

- LW-124 — Sistema de Friend Session en Temps Real (continuació)
- LW-389 — WebRTC Chat Coach–Client
- LW-257 — Seguiment de Progrés i Analytics
- LW-411 — Correcció de Bugs Funcionals i UI
- LW-436 — Implementació d'estratègia de testing (inici)

### Objectius

**Fase 1 — MVP:**

- Completar la funcionalitat de sessions d'entrenament (cronòmetre, repeticions, pesos i resum final).
- Millorar la gestió de rutines i exercicis (filtres avançats, selecció múltiple i edició).
- Finalitzar la comunicació en temps real (chat p2p estable entre coach i client).
- Optimitzar la interfície i experiència d'usuari (disseny, responsive i canvi d'idioma).
- Detectar i corregir bugs per estabilitzar l'aplicació (frontend i backend).
- Consolidar la relació coach–client i els seus fluxos dins l'app.
- Preparar l'aplicació per a la presentació final (MVP estable i funcional).

**Fase 2 — SDD i Qualitat:**

- Implementar i estructurar el testing (unitari i E2E).
- Integrar metodologia Spec-Driven Development i millorar la documentació del projecte.
- Configurar el desplegament en producció (domini, IP, HTTPS i GitHub Actions).

### Tasques per membre

#### Brian

| Clau   | Descripció                                                               |
| ------ | ------------------------------------------------------------------------ |
| —      | Implementar session summary (resum complet de l'entrenament al frontend) |
| —      | Corregir bugs a la branca dev i finalitzar l'associació coach–client     |
| —      | Investigar i configurar Vitest per al testing del frontend               |
| —      | Implementar tests E2E de Friend Session (OpenSpec)                       |
| —      | Configurar i implementar tests E2E per al pipeline de CI                 |

#### Valeria

| Clau       | Descripció                                                   |
| ---------- | ------------------------------------------------------------ |
| —          | Configurar OpenSpec i metodologia SDD al projecte            |
| —          | Crear i adaptar documentació d'arquitectura i funcionalitats |
| —          | Crear tasks a Jira i prioritzar-les per a la Fase 2          |
| —          | Configurar producció: redirect al nou domini i HTTPS         |
| —          | Arxivar tickets pendents amb OpenSpec                        |

#### Amin

| Clau | Descripció                                                                |
| ---- | ------------------------------------------------------------------------- |
| —    | Millorar disseny i gestió de filtres a ExercisesForm                      |
| —    | Millorar lògica de neteja del chat p2p                                    |
| —    | Actualitzar traduccions (i18n) per als requisits de contrasenya           |
| —    | Imposar longitud mínima de contrasenya al formulari de registre           |
| —    | Arreglar error de chat i millorar ExerciseSearchModal (selecció múltiple) |
| —    | Compra de domini (Cdmon) i configuració IP/DNS/HTTPS                      |
| —    | Configuració VSCode + Atlassian MCP                                       |
| —    | Iniciar implementació testing (target LW-441)                             |

#### David

| Clau   | Descripció                                                   |
| ------ | ------------------------------------------------------------ |
| —      | Docker Compose + Prisma connexió a PostgreSQL                |
| —      | Correccions errors i ajustos al docker-compose.yml           |
| —      | SSH, verificació GitHub Actions (TR3)                        |
| —      | Publicar domini web del TR3 a la IP                          |

### Presentació MVP

El **06/03/2026** es va realitzar la presentació del MVP davant del professorat. L'aplicació ja comptava amb:

- Autenticació JWT (registre, login, logout) per a coaches i clients.
- CRUD complet de rutines amb editor d'exercicis.
- Sistema d'invitació coach–client.
- Friend Sessions en temps real (Socket.IO).
- Chat p2p WebRTC entre coach i client.
- Desplegament en producció (VM, Docker, domini, HTTPS, CI/CD).

### Revisió del Sprint

> Aquest sprint s'ha dividit en dues fases diferenciades. En una primera fase, l'objectiu va ser arribar a una versió funcional del producte per a la presentació del MVP. Es van completar les funcionalitats principals com la gestió de sessions d'entrenament, la millora dels filtres i exercicis, així com l'estabilització general de l'aplicació mitjançant la correcció de bugs i millores d'experiència d'usuari.
>
> Un cop presentat el MVP, el projecte es va pausar temporalment. En reprendre'l, es va iniciar una segona fase més enfocada a la qualitat i escalabilitat del sistema. Durant aquesta etapa, es va començar a implementar la metodologia Spec-Driven Development (SDD), definint millor els requisits i estructurant la documentació del projecte.
>
> Paral·lelament, es va iniciar la implementació del testing (tant unitari com E2E), així com la reorganització de tasques i millora dels fluxos de treball. També es va avançar en la configuració del desplegament (domini, HTTPS i automatitzacions), deixant l'aplicació en un estat més robust, mantenible i preparada per a futures ampliacions.

---

## Sprint 4 — Testing, Analytics i Presentació Final

**Dates:** 04/05/2026 – 15/05/2026  
**Epics principals:**

- LW-436 — Implementació d'estratègia de testing (E2E + unitaris)
- LW-257 — Seguiment de Progrés i Analytics (completat)
- LW-411 — Correcció de Bugs (en curs)

### Objectius

- Finalitzar la implementació del sistema de testing del projecte (tests unitaris, E2E i integració amb el pipeline de CI).
- Implementar les funcionalitats de progrés i analytics per al panell del coach.
- Elaborar i actualitzar tota la documentació tècnica i funcional del projecte utilitzant OpenSpec i metodologia SDD.
- Preparar la presentació final del projecte, incloent demostració, estructura i materials de suport.

### Tasques per membre

#### Brian

| Clau   | Descripció                                                      |
| ------ | --------------------------------------------------------------- |
| LW-258 | Backend: API d'Historial i Estadístiques (finalitzat)           |
| LW-270 | Web Cliente: Vista d'Historial i Estadístiques (finalitzat)     |
| —      | Implementar tests E2E Friend Session amb OpenSpec + Claude Code |
| —      | Implementar tests E2E de CI per a pipelines                     |
| —      | Implementar tests unitaris backend i frontend amb Vitest        |
| —      | Implementar tests de password reset (OpenSpec)                  |
| —      | Investigar i corregir bug d'inici de sessió a la web            |
| —      | Generar tasques a Jira per als tests                            |

#### Valeria

| Clau   | Descripció                                                                   |
| ------ | ---------------------------------------------------------------------------- |
| LW-279 | Web Coach: Panell de Progrés de Clients (finalitzat)                         |
| —      | Connectar Jira MCP per visualitzar totes les èpiques                         |
| —      | Redefinir framework de testing E2E (de Cypress a Playwright)                 |
| —      | Actualitzar documentació i tasques Jira en conseqüència                      |
| —      | Configurar Vitest per al backend i frontend                                  |
| —      | Implementar panell de progrés de clients per al coach (historial, seguiment) |
| —      | Arxivar ticket pendent a OpenSpec (login i registre E2E)                     |
| —      | Implementar flux de restabliment de contrasenya (LW-453)                     |
| —      | Implementar historial i estadístiques per al client (LW-270)                 |

#### Amin

| Clau   | Descripció                                            |
| ------ | ----------------------------------------------------- |
| LW-441 | Implementar tests E2E del flux de login i registre    |
| LW-446 | Crear documentació guia de tests E2E per a l'equip    |
| LW-458 | Friend Session: invitació per cerca d'usuari en línia |
| —      | Configurar VSCode + Atlassian MCP                     |
| —      | Avançar amb documentació de testing                   |
| —      | Acabar tasca de Friend Session (errors a l'aplicació) |

#### David

| Clau   | Descripció                                                            |
| ------ | --------------------------------------------------------------------- |
| LW-288 | Backend: Persistència de Progrés de Sessió en BD                      |
| LW-441 | Implementar tests E2E del flux de login i registre (conjunt amb Amin) |
| —      | Verificar que el testing generat per Copilot funcioni a la web        |
| —      | Solucionar errors generats i posar-ho a dev                           |
| LW-458 | Friend Session: tasca d'invitació (en curs)                           |
| —      | Publicar imatges als exercicis per a visualització                    |

---

## Proves d'Usuari (User Acceptance Testing)

Les proves d'usuari s'han realitzat de forma manual seguint els escenaris documentats a [doc/Proves_usuari.md](Proves_usuari.md). Es van dur a terme principalment durant el **Sprint 4**, un cop les funcionalitats estaven desplegades a producció.

### LW-441 — Autenticació (Sprint 4)

Cobert per tests E2E automatitzats (Playwright) i verificació manual:

| Escenari                     | Resultat esperat                                    |
| ---------------------------- | --------------------------------------------------- |
| Registre d'usuari nou        | Redirigeix a `/login`, toast de confirmació         |
| Registre amb dades invàlides | Errors de validació visibles                        |
| Login correcte COACH         | Redirigeix a `/dashboard`                           |
| Login correcte CLIENT        | Redirigeix a `/client-home`                         |
| Login incorrecte             | Alerta "Usuari o contrasenya invàlids", sense token |
| Logout                       | Redirigeix a `/login`, localStorage buit            |
| Persistència de sessió (F5)  | Romanem al dashboard sense re-login                 |

### LW-258 — API de Progrés (Sprint 4)

Proves manuals via API directa:

| Endpoint                             | Verificació                                              |
| ------------------------------------ | -------------------------------------------------------- |
| `GET /api/progress/client/sessions`  | Sessions completades retornades, PENDING/ACTIVE excloses |
| `GET /api/progress/client/stats`     | Totals agregats correctes (sessions, sèries, exercicis)  |
| `GET /api/progress/coach/clients`    | Llista clients amb `lastSessionAt` i `totalSessions`     |
| `GET /api/progress/coach/client/:id` | Historial de sessions d'un client concret                |
| Control d'accés                      | 401 sense token, 403 amb rol incorrecte                  |

### LW-279 — Progrés de Clients — Panell Coach (Sprint 4)

Proves manuals al frontend:

| Escenari                    | Resultat esperat                                             |
| --------------------------- | ------------------------------------------------------------ |
| Accés a `/clients/progress` | Taula de clients amb activitat                               |
| Clic en fila de client      | Navega a `/clients/progress/:clientId`                       |
| Estadístiques del client    | Tres targetes (sessions, sèries, exercicis) amb valors reals |
| Gràfic de barres            | Apareix per a clients amb sessions, ocult sense sessions     |
| Accés no autenticat         | Redirigeix a `/login`                                        |
| Accés com a CLIENT          | Redirigeix a `/client-home`                                  |

### LW-445 — Tests E2E en CI (Sprint 4)

Verificació del workflow de GitHub Actions en cada PR a `main`:

| Check                  | Estat                                   |
| ---------------------- | --------------------------------------- |
| `e2e / playwright`     | S'executa automàticament en cada PR     |
| Suite completa en verd | PR pot fer-se merge                     |
| Fallada → artefactes   | `e2e-report-<run_id>` disponible 7 dies |
| Retries flaky          | Fins a 2 reintents automàtics en CI     |

### LW-270 — Historial i Estadístiques del Client (Sprint 4)

Proves manuals al frontend:

| Escenari                        | Resultat esperat                    |
| ------------------------------- | ----------------------------------- |
| Botó historial al dashboard     | Visible a `/client-home`            |
| Navegació a `/client/history`   | Sense recàrrega completa            |
| Sessions completades            | Ordenades per data descendent       |
| Sessió nova apareix             | Primera fila amb data i % correctes |
| Accés COACH a `/client/history` | Redirigeix al dashboard del coach   |

### LW-454 — Flux de Recuperació de Contrasenya (Sprint 4)

Proves manuals end-to-end:

| Escenari                               | Resultat esperat                                             |
| -------------------------------------- | ------------------------------------------------------------ |
| Sol·licitar reset — email registrat    | Missatge genèric, email amb token (Ethereal en dev)          |
| Sol·licitar reset — email no registrat | Error en línia, sense redirecció                             |
| Restablir contrasenya — flux exitós    | Toast d'èxit, redirecció a `/login`, login amb nova password |
| Contrasenyes no coincidents            | Error client-side, sense crida a API                         |
| Token expirat o ja usat                | Missatge d'error + link a `/forgot-password`                 |

---

## Resum de Tasques per Membre

| Membre  | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Total aprox. |
| ------- | -------- | -------- | -------- | -------- | ------------ |
| Valeria | 14       | 21       | 5        | 9        | ~49          |
| Brian   | 9        | 23       | 5        | 8        | ~45          |
| David   | 10       | 18       | 4        | 6        | ~38          |
| Amin    | 14       | 16       | 8        | 6        | ~44          |

> El recompte de tickets no és equivalent a volum de feina. Els números s'han d'interpretar com a indicació d'activitat registrada, no com a mesura directa de contribució.
>
> Les tasques sense clau Jira corresponen a activitats registrades a la bitàcola de seguiment però no obertes formalment al tauler.

---

## Resum d'Epics per Sprint

| Epic   | Descripció                                             | Sprint inici | Sprint fi | Estat       |
| ------ | ------------------------------------------------------ | ------------ | --------- | ----------- |
| LW-5   | Autenticació Coach i Infraestructura Web SPA           | 1            | 2         | Finalitzada |
| LW-48  | Dashboard Coach amb Llista i Editor de Rutines         | 2            | 2         | Finalitzada |
| LW-81  | Invitació i Perfil de Clients                          | 2            | 2         | Finalitzada |
| LW-383 | Deployment Continu                                     | 2            | 2         | Finalitzada |
| LW-124 | Sistema de Friend Session en Temps Real                | 2            | 4         | En curs     |
| LW-389 | WebRTC Chat Coach–Client (DataChannel + Socket.IO)     | 3            | 3         | Finalitzada |
| LW-257 | Seguiment de Progrés i Analytics                       | 3            | 4         | Finalitzada |
| LW-411 | Correcció de Bugs Funcionals i UI                      | 3            | 4         | En curs     |
| LW-436 | Implementació d'estratègia de testing (E2E + unitaris) | 3–4          | 4         | En curs     |
