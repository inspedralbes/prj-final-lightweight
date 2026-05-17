## ADDED Requirements

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
