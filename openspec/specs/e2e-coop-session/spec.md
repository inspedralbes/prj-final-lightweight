# Spec: Sessió Cooperativa E2E

## Propòsit

Proporciona tests end-to-end que cobreixen el flux complet de sessió cooperativa entre dos usuaris: configuració de fixtures per a tests multi-context, generació de codi de FriendSession, unió de dos usuaris al VirtualGymRoom, sincronització del progrés d'exercicis en temps real, finalització de sessió i gestió de la desconnexió de l'amfitrió.

---

## Requisits

### Requisit: Fixture multi-context per a tests de dos usuaris

El workspace E2E HA DE proporcionar una fixture `twoContexts` a `e2e/fixtures/two-contexts.ts` que creï dues instàncies de `BrowserContext` independents — una autenticada com a `e2e_coach` (COACH) i una com a `e2e_client_linked` (CLIENT) — usant el helper `loginViaApi` existent aplicat a la pàgina de cada context. La fixture HA DE tancar tots dos contextos al final del test. El barrel `e2e/fixtures/index.ts` HA DE re-exportar l'objecte `test` estès que inclou `twoContexts`, `loginAs` i `freshDb`.

#### Escenari: twoContexts proporciona sessions autenticades independents

- **DONAT** el backend en marxa amb `E2E_TESTING=true` i el seed aplicat
- **QUAN** un test usa la fixture `twoContexts`
- **ALESHORES** `coachPage.evaluate(() => localStorage.getItem('userRole'))` retorna `'COACH'`
- **I** `clientPage.evaluate(() => localStorage.getItem('userRole'))` retorna `'CLIENT'`
- **I** `coachPage.evaluate(() => localStorage.getItem('username'))` retorna `'e2e_coach'`
- **I** `clientPage.evaluate(() => localStorage.getItem('username'))` retorna `'e2e_client_linked'`
- **I** les dues pàgines pertanyen a contextos de navegador diferents (localStorage d'orígens separats)

#### Escenari: Els contextos de twoContexts es tanquen al final del test

- **DONAT** un test que usa `twoContexts` i llança un error a mig test
- **QUAN** s'executa el teardown del test
- **ALESHORES** tots dos contextos de navegador es tanquen (sense fuites de recursos de Playwright)

---

### Requisit: El coach genera un codi de FriendSession via la UI

El test E2E HA DE verificar que un usuari COACH pot navegar a la pàgina de FriendSession, fer clic a "Generar codi", i rebre un codi de sessió no buit mostrat a la UI.

#### Escenari: El coach genera un codi de sessió

- **DONAT** que `e2e_coach` és autenticat i és a la pàgina de FriendSession (`/friend-session`)
- **QUAN** el coach fa clic al botó "Generar codi"
- **ALESHORES** una cadena de codi no buida es mostra a la pàgina en 5 segons
- **I** el codi es pot llegir del DOM via un element `data-testid="generated-code"` (o el camp de text visible que mostra el codi)

#### Escenari: El coach veu el botó de còpia després de generar el codi

- **DONAT** que s'ha generat un codi i es mostra
- **QUAN** el coach veu la pàgina
- **ALESHORES** un botó de copiar al porta-retalls és visible al costat del codi

#### Escenari: L'usuari no autenticat no pot accedir a la pàgina FriendSession

- **DONAT** que no hi ha token a localStorage
- **QUAN** l'usuari navega a `/friend-session`
- **ALESHORES** se'l redirigeix a `/login` (el guard React Router ProtectedRoute s'activa)

---

### Requisit: Tots dos usuaris s'uneixen al VirtualGymRoom i es veuen mútuament

El test E2E HA DE verificar el flux complet d'unió de dos usuaris: el coach crea una sala usant el codi d'invitació sembrat `E2E-INVITE-001` (via navegació directa, evitant la generació de codi via UI per mantenir el test determinista), el client s'uneix a la mateixa sala, i tots dos contextos reben l'event `roomUsersUpdate` reflectit com a dues entrades a la llista d'usuaris.

#### Escenari: El coach s'uneix a la sala com a amfitrió i es veu a si mateix

- **DONAT** que `e2e_coach` és autenticat i navega a `/workout/room/E2E-INVITE-001` amb `state: { isHost: true }`
- **QUAN** el VirtualGymRoom es munta i Socket.IO es connecta a `/room`
- **ALESHORES** la pàgina mostra un estat connectat (el carregador desapareix, el lobby es renderitza) en 5 segons
- **I** el nom d'usuari del coach (`e2e_coach`) apareix a la llista d'usuaris

#### Escenari: El client s'uneix a la sala i tots dos usuaris es veuen mútuament

- **DONAT** que `e2e_coach` ja és a la sala com a amfitrió (del pas anterior)
- **QUAN** `e2e_client_linked` navega a `/workout/room/E2E-INVITE-001` (sense el flag `isHost`)
- **ALESHORES** el context del client mostra dos usuaris a la sala en 5 segons
- **I** el context del coach també mostra dos usuaris a la sala (`roomUsersUpdate` rebut)

#### Escenari: La sala reflecteix els rols correctes d'amfitrió/convidat

- **DONAT** que tots dos usuaris s'han unit a la sala
- **QUAN** s'inspecciona la UI del lobby
- **ALESHORES** `e2e_coach` veu el botó "Iniciar sessió" (UI d'amfitrió)
- **I** `e2e_client_linked` NO veu el botó "Iniciar sessió" (UI de convidat)

---

### Requisit: La sessió comença i el progrés d'exercicis es sincronitza

El test E2E HA DE verificar que el coach pot iniciar la sessió, i que les actualitzacions de progrés enviades per un participant les rep l'altre via l'event Socket.IO `opponentProgressUpdate`, reflectides a la UI.

#### Escenari: El coach inicia la sessió i tots dos veuen el compte enrere

- **DONAT** que `e2e_coach` i `e2e_client_linked` estan al lobby
- **QUAN** `e2e_coach` fa clic a "Iniciar sessió"
- **ALESHORES** l'event `sessionStarting` es dispara i tots dos contextos transicionen fora de l'estat del lobby
- **I** totes dues pàgines renderitzen la interfície d'entrenament activa (compte enrere o vista d'exercicis) en 8 segons

#### Escenari: L'actualització de progrés del coach apareix a la vista del client

- **DONAT** que la sessió és activa en tots dos contextos
- **QUAN** `e2e_coach` avança al següent exercici (emet `updateProgress`)
- **ALESHORES** la pàgina de `e2e_client_linked` mostra el progrés actualitzat del coach en 5 segons (p. ex. la barra de progrés de l'oponent o el nom de l'exercici s'actualitzen)

#### Escenari: L'actualització de progrés del client apareix a la vista del coach

- **DONAT** que la sessió és activa en tots dos contextos
- **QUAN** `e2e_client_linked` avança un exercici (emet `updateProgress`)
- **ALESHORES** la pàgina de `e2e_coach` mostra el progrés actualitzat del client en 5 segons

---

### Requisit: La sessió es completa i les estadístiques es persisteixen

El test E2E HA DE verificar que quan tots dos participants acaben la sessió, la UI transiciona a `SessionSummary` i el backend registra la sessió com a `COMPLETED`.

#### Escenari: Tots dos usuaris acaben i veuen el resum

- **DONAT** que `e2e_coach` i `e2e_client_linked` han completat tots els exercicis
- **QUAN** cadascun emet `sessionFinished` (completant el flux de la UI d'entrenament)
- **ALESHORES** totes dues pàgines naveguen al component `SessionSummary` o estat de finalització equivalent en 10 segons
- **I** cap pàgina mostra un estat d'error

#### Escenari: L'estat de la sessió és COMPLETED al backend après de finalitzar

- **DONAT** que la sessió ha estat completada per tots dos usuaris
- **QUAN** el test crida `GET /api/session/E2E-INVITE-001` (o el codi de sessió creat dinàmicament)
- **ALESHORES** la resposta de l'API té `status: 'COMPLETED'`

#### Escenari: El company veu la notificació de partner-finished quan l'amfitrió acaba primer

- **DONAT** que `e2e_coach` acaba abans que `e2e_client_linked`
- **QUAN** `e2e_coach` emet `sessionFinished`
- **ALESHORES** la pàgina de `e2e_client_linked` rep l'event `partnerFinished` i mostra un indicador visual que el company ha acabat

---

### Requisit: La desconnexió de l'amfitrió es gestiona de forma elegant

El test E2E HA DE verificar que si el coach (amfitrió) abandona la sala, la UI del client reflecteix la desconnexió de l'amfitrió.

#### Escenari: El client veu l'estat de desconnexió de l'amfitrió quan el coach marxa

- **DONAT** que tots dos usuaris estan en una sessió activa
- **QUAN** el context de navegador de `e2e_coach` es tanca (simulant una desconnexió)
- **ALESHORES** la pàgina de `e2e_client_linked` rep `hostDisconnected` i mostra un missatge de desconnexió o redirigeix al lobby en 8 segons
- **I** la sala es neteja del costat del servidor (sense entrada de sala en memòria obsoleta)
