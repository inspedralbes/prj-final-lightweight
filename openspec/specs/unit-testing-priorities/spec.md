# Unit Testing Priorities

## Purpose

Llista priorititzada (P0 / P1 / P2) i aprovada de mòduls del backend i de features/components/utilitats del frontend a cobrir amb tests unitaris al projecte LightWeight. Aquesta llista és la font única de veritat per ordenar l'esforç de cobertura: alimenta les properes US d'escriptura de tests (`backend-unit-testing` i `frontend-unit-testing`) i evita gastar temps en tests de baix valor.

La llista és viva — qualsevol PR que afegeix, modifica significativament o retira un mòdul amb lògica HAURÀ d'actualitzar la taula d'aquest spec.

> Tracking: Jira US **LW-449** — *Definir àrees prioritàries per a tests unitaris (back + front)*.

## Criteris de priorització

Cada element de les taules es classifica aplicant tres eixos:

- **Risc**: l'impacte que tindria un bug en producció. Eix prioritari quan el bug pot deixar usuaris fora del sistema, comprometre dades o saltar-se l'autorització (rol coach vs client). Mètrica: alt / mitjà / baix.
- **Complexitat**: nombre de branques, validacions encadenades, autoritzacions creuades o estats interns. Aproximació: ≥3 branques significatives o ≥100 LOC ≈ alta; lògica linear simple ≈ baixa.
- **Freqüència de canvi**: vegades que el fitxer s'ha tocat als darrers 90 dies (`git log --since="90 days ago" --pretty=format: --name-only -- <file> | wc -l`). Alt = ≥6 canvis, mitjà = 2-5, baix = ≤1.

La prioritat resultant agrega els tres eixos:

- **P0** — almenys un eix és **alt** i és risc o complexitat (ex.: lògica d'auth amb molts canvis recents). Cobertura obligatòria abans del proper lliurament del TFG.
- **P1** — risc o complexitat mitjà-alt sense ser crític. Cobertura objectiu durant el sprint actual, després dels P0.
- **P2** — risc baix o lògica majoritàriament linear. Cobertura "nice-to-have" si queda temps abans de la defensa.

## Backend (`src/back/src/`)

| Mòdul | Ruta | Prioritat | Justificació (risc · complexitat · freqüència) | Mocks / dependències |
|---|---|---|---|---|
| `AuthService` | `auth/auth.service.ts` | **P0** | **Risc alt**: login/register són la porta d'entrada; un bug exposa comptes o trenca l'accés · **complexitat mitjana**: hashing bcrypt, generació JWT, validacions · freqüència mitjana | `PrismaService`, `JwtService`, `bcrypt.hash`, `bcrypt.compare` |
| `JwtStrategy` | `auth/strategies/jwt.strategy.ts` | **P0** | **Risc alt**: extreu user del payload i el lliga a request; bug aquí desautoritza o sobreautoritza · complexitat baixa · freqüència baixa | `PrismaService` (validació d'usuari encara existent) |
| `CoachGuard` / `JwtAuthGuard` | `auth/guards/*.ts` | **P0** | **Risc alt**: separa rutes coach-only de client-only; bug = accés indegut · complexitat baixa · freqüència baixa | `ExecutionContext`, `Reflector`, request mock amb `user.role` |
| `InvitationsService` | `invitations/invitations.service.ts` (212 LOC) | **P0** | **Risc alt**: enllaç coach↔client erroni trencaria la confiança · **complexitat alta**: codi únic, expiració, transicions PENDING→ACCEPTED/REJECTED/EXPIRED, doble vinculació prohibida · freqüència mitjana | `PrismaService` (User, Invitation, ClientProfile), `EventsGateway` (notificació `notification:new`), `crypto.randomBytes` |
| `RoutinesService` | `routines/routines.service.ts` (269 LOC) | **P0** | **Risc alt**: assignacions creuades (rutina d'un coach assignada a client equivocat) · **complexitat alta**: CRUD Routine + RoutineExercise nested + RoutineAssignment + autorització per `coachId` · freqüència mitjana-alta | `PrismaService` (Routine, RoutineExercise, RoutineAssignment, ExerciseCatalog) |
| `ClientsService` | `clients/clients.service.ts` (297 LOC) | **P1** | Risc mitjà-alt (pot exposar notes privades del coach) · **complexitat alta**: vista coach-only de ClientProfile, filtrats, paginació · freqüència mitjana | `PrismaService` (User, ClientProfile, Invitation) |
| `SessionService` | `session/session.service.ts` (131 LOC) | **P1** | Risc mitjà: bug deixa una sessió co-op penjada · **complexitat mitjana**: transicions PENDING→ACTIVE→COMPLETED, generació `sessionCode` únic, vinculació amb Routine · freqüència mitjana | `PrismaService` (LiveSession, LiveParticipant, RoutineAssignment), `crypto.randomBytes` |
| `ChatService` | `chat/chat.service.ts` (146 LOC) | **P1** | Risc mitjà (pèrdua de missatges no és catastròfica però degrada UX) · **complexitat mitjana**: persistència P2PChatMessage, ordenació per pair-id, read receipts · freqüència mitjana | `PrismaService` (P2PChatMessage, User) |
| `ExercisesService` | `exercises/exercises.service.ts` (150 LOC) | **P2** | Risc baix (catàleg read-only, no compromet dades d'usuari) · complexitat mitjana (filtrats per múscul, equipament, search) · freqüència baixa | `PrismaService` (ExerciseCatalog) |
| `EventsGateway` (helpers d'autorització i emissió) | `events/events.gateway.ts` (434 LOC) | **P1** (parcial) | Risc alt en signalling WebRTC i notificacions, però l'eix de cost-benefici dels unitaris baixa amb sockets reals · estratègia: cobrir helpers purs (parsejat de payload, `userIdFromSocket`, autorització de `chat:send`) · freqüència alta | `Server` mock (spy de `to(room).emit`), JWT helper, `PrismaService` per persistència de chat |
| `RoomGateway` (helpers de transició) | `room/room.gateway.ts` (334 LOC) | **P1** (parcial) | Risc mitjà-alt (sessió co-op) · estratègia: cobrir reductors d'estat de sala (afegir/eliminar participant, exercici en curs) sense aixecar Socket.IO real · freqüència mitjana | `Server` mock, `PrismaService` (LiveSession, LiveParticipant, WorkoutEvent) |
| `PrismaService` | `prisma/prisma.service.ts` | **P2** | Risc baix (és wrapper de `PrismaClient`); cap lògica pròpia rellevant · complexitat baixa · freqüència baixa | — (no es cobreix amb spec propi) |
| Controllers (`*.controller.ts`) que només deleguen al service | tots | **Fora d'àmbit** | Vegeu secció "Fora d'àmbit" | — |

## Frontend (`src/front/src/`)

| Element | Ruta | Prioritat | Justificació | Mocks / dependències |
|---|---|---|---|---|
| Axios client + interceptor JWT | `shared/utils/api.ts` (42 LOC) | **P0** | **Risc alt**: tot el frontend depèn d'aquest interceptor (capçalera Authorization, redirecció en 401); bug deixa l'app sense backend · complexitat baixa-mitjana · freqüència baixa | `axios.create`, `localStorage`, `window.location` |
| `AuthContext` | `features/auth/context/AuthContext.tsx` (95 LOC) | **P0** | **Risc alt**: gestiona token, user, boot des de localStorage, logout · complexitat mitjana (efectes, estat de càrrega) · freqüència mitjana | `@/shared/utils/api`, `localStorage`, `react-router-dom` (`useNavigate`) |
| `ProtectedRoute` | `features/auth/components/ProtectedRoute.tsx` (35 LOC) | **P0** | **Risc alt**: bug ⇒ rutes coach accessibles a clients · complexitat baixa-mitjana (rol, redirect) · freqüència baixa | `AuthContext`, `react-router-dom` (`Navigate`, `useLocation`), `i18next` |
| Login form (validació local) | `features/auth/pages/Login.tsx` | **P1** | Risc mitjà (fricció a l'entrada) · complexitat mitjana (estats d'error, retry) · freqüència mitjana | `AuthContext.login`, `react-i18next`, `react-router-dom` |
| Register form (validació local) | `features/auth/pages/Register.tsx` | **P1** | Risc mitjà · complexitat mitjana (selecció rol, validació camps) · freqüència mitjana | `@/shared/utils/api`, `react-i18next`, `react-router-dom` |
| `NotificationContext` | `features/notifications/context/NotificationContext.tsx` (217 LOC) | **P1** | Risc mitjà (notificacions duplicades o perdudes degraden UX, no comprometen seguretat) · **complexitat alta**: dedup per id, persistència localStorage, listener Socket.IO · freqüència mitjana | `@/features/workout/services/socket`, `localStorage`, `AuthContext` |
| Socket singleton | `features/workout/services/socket.ts` (14 LOC) | **P1** | Risc mitjà-alt (singleton trencat = realtime mort) · complexitat baixa però *crítica* perquè s'instancia un sol cop · freqüència baixa | `socket.io-client` (mock de `io()`), env `VITE_BACK_URL` |
| Càlcul d'estat de sessió co-op (helpers de `RoomLobby`/`ActiveSession`) | `features/workout/components/RoomLobby.tsx`, `features/workout/components/ActiveSession.tsx` | **P1** | Risc mitjà · **complexitat alta**: derivació d'estat (qui és host, exercici en curs, participants en línia) · freqüència mitjana-alta | `socket` (mock event emitter), props |
| `chatService` | `features/chat/services/chatService.ts` (94 LOC) | **P1** | Risc mitjà (signalling WebRTC i historial) · complexitat mitjana · freqüència mitjana | `@/shared/utils/api`, `socket` |
| `routineService` | `features/routines/services/routineService.ts` | **P1** | Risc mitjà (assignacions errònies serien visibles al coach) · complexitat mitjana · freqüència mitjana | `@/shared/utils/api` |
| `invitationsService` | `shared/services/invitationsService.ts` | **P1** | Risc mitjà (és el "client" del flux P0 backend) · complexitat baixa-mitjana · freqüència baixa | `@/shared/utils/api` |
| `coachClientService` / `myCoachService` | `features/coach/services/coachClientService.ts`, `features/client/services/myCoachService.ts` | **P2** | Risc baix · complexitat baixa (CRUD passthrough a `api`) · freqüència baixa | `@/shared/utils/api` |
| `useToast` / `useRingtone` | `shared/hooks/*.ts` | **P2** | Risc baix · complexitat mitjana (`useRingtone` gestiona `Audio` API, retries) · freqüència baixa | `Audio` constructor mock, `setTimeout` fake timers |
| `RoutineCard`, `RoutineModal`, `NotificationCenter`, `ExerciseSearchModal` | components amb una mica de lògica condicional | **P2** | Risc baix · complexitat baixa-mitjana · freqüència baixa | `react-i18next`, props/callbacks |
| `ThemeContext`, `ToastProvider`, `LanguageSwitcher`, `ThemeSwitcher` | `shared/context/ThemeContext.tsx`, `shared/components/ToastProvider.tsx`, `shared/layout/*Switcher.tsx` | **P2** | Risc baix · complexitat baixa · freqüència baixa | `localStorage`, `i18next` |
| `Layout`, `AuthPageHeader`, `LoadingScreen`, `Icons`, `ConfirmModal`, `ToastContainer` | `shared/layout/*`, `shared/components/*` UI primitives | **Fora d'àmbit** | Vegeu secció "Fora d'àmbit" | — |
| Pàgines purament composicionals (`CoachDashboard`, `ClientDashboard`, `CoachInvitePage` quan només componen subcomponents) | `features/coach/pages/*`, `features/client/pages/*` | **Fora d'àmbit** | Vegeu secció "Fora d'àmbit" | — |

## Nivells de prioritat

### P0 — Cobrir abans del proper lliurament

Definició: lògica que pot **comprometre seguretat, dades o accés**. La cobertura d'aquests mòduls és bloquejant per al lliurament del TFG.

Inclou (mínim viable): `AuthService`, `JwtStrategy`, guards de rol, `InvitationsService`, `RoutinesService` al backend; interceptor d'`api.ts`, `AuthContext`, `ProtectedRoute` al frontend.

Criteri d'acceptació de cada P0: almenys 1 spec per mètode públic significatiu del service/component, amb branques felices i d'error (`UnauthorizedException`, `BadRequestException`, expiració, duplicats).

### P1 — Cobrir aquest sprint, post-P0

Definició: lògica complexa o amb branques múltiples on bugs degraden l'experiència però no comprometen seguretat.

Inclou: `SessionService`, `ChatService`, `ClientsService`, helpers d'`EventsGateway`/`RoomGateway`; `NotificationContext`, socket singleton, càlcul d'estat de sessió co-op, serveis de feature (chat, routines, invitations) al frontend.

### P2 — A cobrir si hi ha temps

Definició: utilitats pures, helpers de display, components amb una mica de lògica condicional. Cap impacte en seguretat ni en flux principal d'usuari.

Inclou: `ExercisesService` al backend; `useToast`, `useRingtone`, `RoutineCard`, `RoutineModal`, `NotificationCenter`, `ExerciseSearchModal`, `ThemeContext`, `ToastProvider` al frontend.

## Fora d'àmbit

S'exclouen explícitament dels tests unitaris (s'han de validar per altres vies — E2E, QA manual, integració):

1. **Controllers NestJS sense lògica pròpia** — `AppController` i tots els controllers que només validen DTOs amb `class-validator` i deleguen al service. La lògica es prova al service; testar el controller només verifica el cablejat de NestJS.
2. **Components React purament presentacionals** — `Layout`, `AuthPageHeader`, `LoadingScreen`, `Icons`, `ConfirmModal`, `ToastContainer`, wrappers de Flowbite/Tailwind sense estat condicional, capçaleres estàtiques. Es validen via QA manual sobre `doc/Proves_usuari.md`.
3. **Pàgines composicionals sense lògica pròpia** — `CoachDashboard`, `ClientDashboard`, `CoachInvitePage` quan només munten subcomponents (sense data fetching propi ni estat derivat). Si una pàgina passa a tenir data fetching o transformació, ha de ser promoguda a P1/P2.
4. **WebRTC peer-to-peer** — `RTCPeerConnection`, `getUserMedia`, ICE negotiation. Es valida via QA manual de videotrucada (`doc/Proves_usuari.md`). Només es poden cobrir helpers purs de signalling al gateway si s'extreuen del cos del handler.
5. **`PrismaService` i Prisma queries directes** — son wrappers de `PrismaClient`; la cobertura adequada és via tests d'integració (E2E o `vitest` integration amb una DB de proves), fora de l'àmbit dels unitaris.
6. **Migracions de Prisma, `main.ts`, `app.module.ts`, `i18n/config.ts`, `vite.config.ts`, `vitest.config.ts`** — configuració, no lògica.

## Procés de revisió

La taula NO és estàtica. Aquestes regles són d'aplicació obligatòria al PR del codi, no en una revisió posterior:

1. **Mòdul nou amb lògica al codi** — el PR que el crea HAURÀ d'afegir una fila a la taula corresponent (backend o frontend) amb prioritat assignada (P0/P1/P2) i justificació. Si el revisor considera que no aplica, ha de quedar registrat sota "Fora d'àmbit".
2. **Promoció / degradació** — si un mòdul P2 incorpora una autorització, manipulació de dades crítiques o integració de pagaments al PR del canvi, HAURÀ de moure's a P0/P1 amb una nova justificació al mateix PR.
3. **Retirada** — si un mòdul es deprecia o s'elimina del codi, la fila corresponent HAURÀ d'eliminar-se al PR de retirada.
4. **Revisió periòdica** — cada inici de sprint o cada release del TFG, la persona owner del backlog de testing fa una passada ràpida de la taula per detectar entrades obsoletes.
5. **Conflictes de classificació** — si el revisor i l'autor del PR no estan d'acord en P0 vs P1, prevalia la prioritat **més alta** fins que es resolgui en revisió de sprint.

Verificació de la regla 1 al PR (checklist mental del revisor):
- ¿Hi ha un service/context/hook nou? → buscar fila a la taula.
- ¿Hi ha un canvi >50 LOC en un service/context existent classificat com a P2? → considerar promoció.
- ¿S'ha eliminat algun fitxer? → buscar fila i eliminar-la.

## Aprovació

Aquest spec s'entén formalment **aprovat** quan és present a la branca `main` via merge del PR de la US **LW-449**. La data d'aprovació i el commit hash s'anoten al ticket de Jira corresponent.

## Requirements

### Requirement: Existeix una llista priorititzada aprovada de mòduls de backend a cobrir amb tests unitaris

El sistema SHALL proporcionar (HAURÀ DE), dins l'spec `unit-testing-priorities`, una taula priorititzada (P0 / P1 / P2) dels mòduls de backend (`src/back/src/`) candidats a tests unitaris. Cada fila MUST (HAURÀ D')incloure: nom del mòdul, ruta, prioritat, justificació breu (amb referència explícita a risc, complexitat o freqüència de canvi) i les dependències a mockar (típicament `PrismaService`, `JwtService`, `EventsGateway`).

#### Scenario: La taula de backend existeix amb prioritats P0/P1/P2

- **GIVEN** un revisor obre `openspec/specs/unit-testing-priorities/spec.md`
- **WHEN** llegeix la secció "Backend"
- **THEN** el document HAURÀ DE contenir una taula amb almenys una fila P0 (mínim: `auth.service`, `invitations.service`, `routines.service`), almenys una fila P1 (mínim: `session.service`, `chat.service`, `clients.service`) i almenys una fila P2

#### Scenario: Cada fila P0 documenta els tres eixos de priorització

- **GIVEN** la taula de backend
- **WHEN** s'inspecciona qualsevol fila marcada com a P0
- **THEN** la justificació HAURÀ DE mencionar de manera explícita almenys un eix de risc (impacte d'un bug en seguretat o pèrdua de dades), un eix de complexitat (branques, validacions, autorització creuada) i, quan sigui rellevant, un eix de freqüència de canvi

#### Scenario: Es declaren les dependències a mockar

- **GIVEN** una fila qualsevol de la taula de backend
- **WHEN** s'inspecciona la columna "Mocks/dependències"
- **THEN** HAURÀ D'enumerar les peces a mockar amb `vi.fn()` o `Mock<typeof X>` (ex. `PrismaService`, `JwtService`, `bcrypt.compare`, `EventsGateway.server`), seguint el patró del harness Vitest documentat a `backend-unit-testing`

#### Scenario: La taula es revisa al PR del codi

- **GIVEN** un PR que afegeix un nou mòdul a `src/back/src/`
- **WHEN** el revisor inspecciona els fitxers modificats
- **THEN** la taula d'aquesta spec HAURÀ DE contenir una nova fila per al mòdul afegit, amb prioritat assignada (encara que sigui P2), o el PR HAURÀ DE ser bloquejat fins que es completi

### Requirement: Existeix una llista priorititzada aprovada de mòduls de frontend a cobrir amb tests unitaris

El sistema SHALL proporcionar (HAURÀ DE), dins el mateix spec, una taula priorititzada (P0 / P1 / P2) de features, components, hooks i utilitats de frontend (`src/front/src/`) candidats a tests unitaris. Cada fila MUST (HAURÀ D')incloure: nom de l'element, ruta, prioritat, justificació breu i dependències a mockar (típicament `axios`/`api`, `socket`, contextos de React).

#### Scenario: La taula de frontend existeix amb prioritats P0/P1/P2

- **GIVEN** un revisor obre `openspec/specs/unit-testing-priorities/spec.md`
- **WHEN** llegeix la secció "Frontend"
- **THEN** el document HAURÀ DE contenir una taula amb almenys una fila P0 (mínim: `shared/utils/api.ts` interceptor, `features/auth/context/AuthContext`, `features/auth/components/ProtectedRoute`), almenys una fila P1 (mínim: `features/notifications/context/NotificationContext`, `features/workout/services/socket`, càlcul d'estat de sessió co-op) i almenys una fila P2

#### Scenario: La taula exclou explícitament UI presentacional

- **GIVEN** la taula de frontend
- **WHEN** s'inspecciona la secció "Fora d'àmbit"
- **THEN** HAURÀ D'enumerar tipologies excloses dels tests unitaris: components purament presentacionals sense lògica condicional, wrappers de Flowbite/Tailwind sense estat, pàgines que només componen subcomponents

#### Scenario: Es declaren les dependències a mockar

- **GIVEN** una fila qualsevol de la taula de frontend
- **WHEN** s'inspecciona la columna "Mocks/dependències"
- **THEN** HAURÀ D'enumerar les peces a mockar amb `vi.mock()` (ex. `@/shared/utils/api`, `socket`, `react-router-dom`, `i18next`, `localStorage`)

### Requirement: Els criteris de priorització estan documentats

L'spec SHALL definir (HAURÀ DE), en una secció pròpia, com es calcula la prioritat de cada element a partir dels tres eixos: risc, complexitat i freqüència de canvi. Els nivells P0 / P1 / P2 MUST (HAURAN DE) tenir definicions textuals que un revisor pugui aplicar al PR.

#### Scenario: Els tres eixos estan definits

- **GIVEN** un revisor obre l'spec
- **WHEN** llegeix la secció "Criteris de priorització"
- **THEN** HAURÀ DE trobar definicions explícites per a "risc" (impacte d'un bug en seguretat, dades o accés), "complexitat" (nombre de branques, autoritzacions creuades, validacions encadenades) i "freqüència de canvi" (mòdul tocat sovint en commits dels darrers 90 dies)

#### Scenario: Els nivells P0/P1/P2 tenen definicions accionables

- **GIVEN** un revisor de PR que ha d'assignar una prioritat a un mòdul nou
- **WHEN** consulta la secció "Nivells de prioritat"
- **THEN** HAURÀ DE poder assignar P0/P1/P2 amb un criteri reproduïble (definició textual amb exemples concrets), sense negociació subjectiva

#### Scenario: P0 implica cobertura abans del proper lliurament

- **GIVEN** un mòdul classificat com a P0 a la taula
- **WHEN** s'inspecciona el calendari del projecte
- **THEN** la planificació de tasques HAURÀ DE situar la seva cobertura amb tests unitaris dins el sprint en curs o el següent, abans de qualsevol P1/P2

### Requirement: Llista explícita de què queda fora dels tests unitaris

L'spec MUST incloure (HAURÀ D') una secció "Fora d'àmbit" que enumeri les tipologies de codi que SHALL ser excloses de la cobertura unitària, per evitar gastar esforç en tests de baix valor.

#### Scenario: Controllers NestJS sense lògica queden fora

- **GIVEN** un controller que només delega al service (ex. `AppController`, controllers CRUD passthrough)
- **WHEN** es consulta la secció "Fora d'àmbit"
- **THEN** HAURÀ DE confirmar que aquest tipus de controller no requereix spec unitari propi (la lògica es prova al service)

#### Scenario: Components React purament presentacionals queden fora

- **GIVEN** un component sense estat ni lògica condicional (ex. botó wrapper, capçalera estàtica)
- **WHEN** es consulta la secció "Fora d'àmbit"
- **THEN** HAURÀ DE confirmar que aquests components no entren a la taula priorityzada

#### Scenario: WebRTC peer-to-peer queda fora dels tests unitaris

- **GIVEN** la signalling i el peer-to-peer establert per `RTCPeerConnection`
- **WHEN** es consulta la secció "Fora d'àmbit"
- **THEN** HAURÀ DE confirmar que el peer-to-peer no es prova en unitaris (es valida via QA manual sobre `doc/Proves_usuari.md`); només es poden cobrir helpers o reductors d'estat de signalling

### Requirement: Procés de revisió de la llista

L'spec SHALL definir (HAURÀ DE) un procés explícit que MUST aplicar-se per mantenir la llista actualitzada quan apareixen, canvien o es retiren mòduls.

#### Scenario: Mòdul nou afegit al codi

- **GIVEN** un PR que afegeix un nou service backend o feature frontend amb lògica
- **WHEN** el PR és obert per a revisió
- **THEN** HAURÀ D'incloure una entrada nova a la taula corresponent, o una raó documentada per excloure'l

#### Scenario: Promoció d'un mòdul P2 a P0

- **GIVEN** un mòdul classificat com a P2 que pateix un canvi significatiu (nova autorització, integració de pagaments, manipulació de dades crítiques)
- **WHEN** el PR del canvi és obert
- **THEN** HAURÀ D'actualitzar la fila per moure'l a la prioritat adequada, amb una nova justificació

#### Scenario: Retirada d'un mòdul

- **GIVEN** un mòdul depreciat o eliminat del codi
- **WHEN** el PR de retirada és obert
- **THEN** la fila corresponent HAURÀ DE ser eliminada de la taula

### Requirement: Aprovació documentada de la llista

L'spec MUST estar (HAURÀ D'estar) formalment aprovat (criteri d'acceptació de la US LW-449). L'aprovació SHALL materialitzar-se com el merge a `main` del fitxer `openspec/specs/unit-testing-priorities/spec.md` via PR revisat.

#### Scenario: La llista està al main

- **GIVEN** la branca `main` després del merge del canvi `lw-449-prioritize-unit-test-areas`
- **WHEN** s'inspecciona `openspec/specs/`
- **THEN** HAURÀ D'existir el fitxer `unit-testing-priorities/spec.md` amb les seccions Backend, Frontend, Criteris de priorització, Nivells de prioritat, Fora d'àmbit i Procés de revisió

#### Scenario: La llista és visible per a tot el projecte

- **GIVEN** un membre de l'equip que vol començar a escriure tests
- **WHEN** consulta l'spec a `openspec/specs/unit-testing-priorities/spec.md`
- **THEN** HAURÀ DE poder identificar el següent mòdul P0 a cobrir sense necessitat de discussió addicional

### Requirement: Testabilitat — verificació de l'spec

La completesa i la correcció de l'spec MUST ser (HAURAN DE) verificables mitjançant un procediment documentat de revisió manual, atès que aquesta capability no produeix codi executable. El revisor SHALL poder marcar cada punt del checklist sense executar codi d'aplicació.

#### Scenario: Procediment de verificació manual

- **GIVEN** un revisor amb el PR del canvi obert
- **WHEN** segueix el checklist: (1) la taula de backend conté ≥1 fila per cada nivell P0/P1/P2; (2) la taula de frontend conté ≥1 fila per cada nivell; (3) cada fila té justificació + dependències a mockar; (4) hi ha seccions "Criteris de priorització", "Nivells de prioritat", "Fora d'àmbit" i "Procés de revisió"
- **THEN** HAURÀ DE poder marcar cadascun dels punts del checklist sense necessitat d'executar codi

#### Scenario: Comanda de validació de l'spec

- **GIVEN** un desenvolupador a la branca del canvi
- **WHEN** executa `openspec validate lw-449-prioritize-unit-test-areas`
- **THEN** la comanda HAURÀ DE retornar exit code 0 sense errors de format de spec
