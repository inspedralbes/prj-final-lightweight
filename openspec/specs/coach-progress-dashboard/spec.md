# Spec: Tauler de Progrés de l'Entrenador

## Propòsit

Proporciona pàgines frontend exclusives per a entrenadors per visualitzar el progrés d'entrenament dels clients. Exposa les dades de la `progress-api` del backend existent sense afegir nous endpoints. Inclou una llista d'activitat de clients i una vista de detall per client amb historial de sessions, estadístiques agregades i un gràfic de barres simple.

## Requirements

### Requirement: Coach can view client activity list

El sistema HAURÀ de renderitzar una pàgina a `/clients/progress` (accessible únicament per a `UserRole.COACH`) que mostri una llista dels clients assignats a l'entrenador, cadascun amb el nom d'usuari, la data de l'última sessió completada i el nombre total de sessions completades, obtinguts de `GET /progress/coach/clients`.

#### Scenario: Coach navigates to progress page and sees client list
- **WHEN** an entrenador navega a `/clients/progress`
- **THEN** la pàgina renderitza una llista de clients, cadascun amb `username`, `lastSessionAt` (data formatada o "—" si és null) i `totalSessions`

#### Scenario: Client with no completed sessions shows empty values
- **WHEN** un client assignat té `totalSessions: 0` i `lastSessionAt: null`
- **THEN** la fila mostra "—" per a la data de l'última sessió i "0" per al total de sessions

#### Scenario: Unauthenticated user is redirected
- **WHEN** un usuari no autenticat navega a `/clients/progress`
- **THEN** el guard de ruta redirigeix a `/login`

#### Scenario: Client-role user cannot access the page
- **WHEN** un usuari amb `UserRole.CLIENT` navega a `/clients/progress`
- **THEN** el guard de ruta redirigeix fora de la pàgina (a `/client-home`)

#### Scenario: Empty state when coach has no clients with sessions
- **WHEN** l'API retorna un array buit
- **THEN** la pàgina mostra la cadena i18n `progress.noSessions` i cap fila de llista

#### Scenario: Testability — manual QA
- **WHEN** un entrenador inicia sessió i navega a `/clients/progress`
- **THEN** la llista es pobla amb dades reals de clients provinents del backend (no mock)

---

### Requirement: Coach can navigate to a client's progress detail view

El sistema HAURÀ de permetre que l'entrenador cliqui sobre una fila de client a la llista d'activitat i navegui a `/clients/progress/:clientId`, on `:clientId` és l'ID numèric d'usuari del client.

#### Scenario: Coach clicks a client row and lands on the detail page
- **WHEN** un entrenador clica una entrada de client a `/clients/progress`
- **THEN** el router navega a `/clients/progress/:clientId` i la pàgina de detall comença a carregar

#### Scenario: Back navigation returns to client list
- **WHEN** l'entrenador clica el control "tornar a la llista" a la pàgina de detall
- **THEN** el router navega de tornada a `/clients/progress`

#### Scenario: Direct URL access to detail page works
- **WHEN** un entrenador obre `/clients/progress/42` directament al navegador
- **THEN** la pàgina de detall per al client 42 es renderitza correctament

---

### Requirement: Coach can view a client's session history

El sistema HAURÀ de renderitzar una taula d'historial de sessions a `/clients/progress/:clientId` obtinguda de `GET /progress/coach/client/:clientId`, mostrant el nom de la rutina, la data de finalització, el percentatge de compleció i les sèries completades de cada sessió completada, ordenades de la més recent a la més antiga.

#### Scenario: Session history table renders with real data
- **WHEN** un entrenador navega a la pàgina de detall d'un client que té sessions completades
- **THEN** la taula mostra una fila per sessió amb `routineName`, `completedAt` (data formatada), `completionPercentage` (formatat com a `XX%`) i `completedSets`

#### Scenario: Null completionPercentage is rendered as 0%
- **WHEN** una sessió té `completionPercentage: null` (sessió anterior a LW-288)
- **THEN** la cel·la de la taula mostra `0%` i la barra del gràfic té alçada zero

#### Scenario: Empty history shows empty state message
- **WHEN** el client no té sessions COMPLETADES
- **THEN** la taula s'amaga i es mostra la cadena i18n `progress.noSessions`

#### Scenario: Coach accessing a foreign client's detail is blocked
- **WHEN** el `clientId` de la URL no pertany a l'entrenador autenticat
- **THEN** l'API retorna HTTP 404 i la pàgina mostra un estat d'error de no trobat

#### Scenario: Testability — manual QA
- **WHEN** un client de prova completa un entrenament en solitari i l'entrenador navega a la pàgina de detall d'aquell client
- **THEN** la sessió completada apareix a la part superior de la taula d'historial amb dades correctes

---

### Requirement: Coach can view a client's aggregated workout statistics

El sistema HAURÀ de mostrar estadístiques agregades del client seleccionat a la pàgina de detall: sessions totals completades, sèries totals completades i exercicis totals completats, derivats de les dades d'historial de sessions retornades per `GET /progress/coach/client/:clientId`.

#### Scenario: Stats cards render correct totals
- **WHEN** un client té sessions completades amb `completedSets` no null
- **THEN** la pàgina de detall mostra tres targetes d'estadístiques: `totalSessions` (nombre de sessions de l'array), `totalSets` (suma de `completedSets`), `totalExercises` (suma de `completedExercises`, null tractat com a 0)

#### Scenario: Null completedSets contributes zero to total
- **WHEN** algunes sessions tenen `completedSets: null`
- **THEN** aquestes sessions contribueixen 0 a l'agregat `totalSets` mostrat a la pantalla

#### Scenario: Client with no sessions shows all-zero stats
- **WHEN** l'API retorna `{ sessions: [] }`
- **THEN** totes les targetes d'estadístiques mostren 0

---

### Requirement: Coach can see a bar chart of session completion percentages

El sistema HAURÀ de renderitzar un gràfic de barres simple sota la taula d'historial de sessions, amb una barra vertical per sessió completada (fins a les 10 més recents), on l'alçada de la barra correspon a `completionPercentage` (null tractat com a 0%). No s'utilitza cap llibreria externa de gràfics; les barres s'estilen amb CSS/Tailwind.

#### Scenario: Bar chart renders one bar per session
- **WHEN** un client té 5 sessions completades amb percentatges de compleció variats
- **THEN** es renderitzen 5 barres, cadascuna amb una alçada proporcional al seu `completionPercentage`

#### Scenario: Bar with null percentage renders as a flat visible bar
- **WHEN** una sessió té `completionPercentage: null`
- **THEN** la seva barra es renderitza amb una alçada mínima visible (≥ 1px) etiquetada com "0%", en lloc de desaparèixer del gràfic

#### Scenario: Chart is hidden when there are no sessions
- **WHEN** l'array de sessions és buit
- **THEN** la secció del gràfic de barres no es renderitza

---

### Requirement: Progress pages are fully translated

El sistema HAURÀ de mostrar tot el text visible per a l'usuari a les pàgines de progrés utilitzant claus i18n presents a `ca.json`, `es.json` i `en.json`. El català és l'idioma per defecte.

#### Scenario: i18n keys exist in all three locale files
- **WHEN** `npm run build` té èxit després d'afegir les pàgines de progrés
- **THEN** les claus `progress.title`, `progress.lastSession`, `progress.totalSessions`, `progress.noSessions`, `progress.sessionHistory`, `progress.routine`, `progress.date`, `progress.completion`, `progress.sets`, `progress.stats.totalSets`, `progress.stats.totalExercises`, `progress.backToList` estan presents a `ca.json`, `es.json` i `en.json`

#### Scenario: Switching language updates progress page text
- **WHEN** un entrenador canvia l'idioma de la UI de català a castellà
- **THEN** totes les etiquetes de les pàgines de progrés s'actualitzen a les traduccions castellanes sense recarregar la pàgina

---

### Requirement: Sidebar navigation includes a link to the progress section

El sistema HAURÀ d'incloure una entrada de navegació que apunti a `/clients/progress` a la barra lateral de l'entrenador, visible únicament per a entrenadors autenticats.

#### Scenario: Progress link appears in coach sidebar
- **WHEN** un entrenador ha iniciat sessió i es renderitza la barra lateral
- **THEN** un element de navegació etiquetat amb `progress.title` (o equivalent) que enllaça a `/clients/progress` és visible

#### Scenario: Progress link is not shown to clients
- **WHEN** un usuari amb `UserRole.CLIENT` visualitza la barra lateral
- **THEN** l'element de navegació de progrés no es renderitza
