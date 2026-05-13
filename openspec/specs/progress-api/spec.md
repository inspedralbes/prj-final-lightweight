# Spec: API de Progrés

## Propòsit

Proporciona endpoints REST per consultar i agregar dades de progrés d'entrenament. Els coaches poden revisar els resums d'activitat i l'historial de sessions dels seus clients. Els clients poden veure el seu propi historial de sessions i estadístiques agregades. Les mètriques de finalització de sessió es persisteixen quan una sessió transiciona a l'estat COMPLETED.

## Requisits

### Requisit: El coach pot llistar clients amb resum d'activitat
El sistema HA DE proporcionar un endpoint `GET /progress/coach/clients` que retorni una llista dels clients del coach autenticat, cadascun amb la data de la seva última sessió completada i el nombre total de sessions completades.

#### Escenari: El coach obté la llista d'activitat de clients
- **QUAN** un coach envia `GET /progress/coach/clients` amb un JWT vàlid
- **ALESHORES** el sistema retorna HTTP 200 amb un array de `{ clientId, username, lastSessionAt, totalSessions }` per a cada client les sessions del qual tenen `coachId` que coincideix amb l'id del coach

#### Escenari: Llista buida quan el coach no té sessions
- **QUAN** un coach sense sessions completades crida `GET /progress/coach/clients`
- **ALESHORES** el sistema retorna HTTP 200 amb `{ clients: [] }`

#### Escenari: La petició no autenticada és rebutjada
- **QUAN** es fa una petició a `GET /progress/coach/clients` sense JWT
- **ALESHORES** el sistema retorna HTTP 401

#### Escenari: El rol CLIENT no pot accedir a l'endpoint del coach
- **QUAN** un usuari amb rol CLIENT crida `GET /progress/coach/clients` amb un JWT vàlid
- **ALESHORES** el sistema retorna HTTP 403

#### Escenari: Testabilitat — test unitari Jest
- **QUAN** `ProgressService.getCoachClientsSummary(coachId)` es crida amb un `PrismaService` mockat que retorna dos grups de `LiveSession`
- **ALESHORES** el mètode retorna un array de dos `CoachClientSummaryDto` amb els comptes de `totalSessions` correctes

---

### Requisit: El coach pot veure l'historial de sessions d'un client
El sistema HA DE proporcionar un endpoint `GET /progress/coach/client/:clientId` que retorni la llista paginada de sessions completades per a un client específic del coach autenticat, incloent el nom de la rutina, la data de finalització, el percentatge de compleció i les sèries completades.

#### Escenari: El coach obté l'historial de sessions per a un client vàlid
- **QUAN** un coach envia `GET /progress/coach/client/42` i el client 42 pertany a aquell coach
- **ALESHORES** el sistema retorna HTTP 200 amb `{ sessions: [{ id, routineName, completedAt, completionPercentage, completedSets }] }` ordenat per `completedAt` descendent

#### Escenari: Client sense sessions completades retorna llista buida
- **QUAN** el client té sessions amb estat PENDING o ACTIVE únicament
- **ALESHORES** el sistema retorna HTTP 200 amb `{ sessions: [] }`

#### Escenari: El coach sol·licita l'historial d'un client aliè
- **QUAN** el `clientId` no pertany al coach autenticat
- **ALESHORES** el sistema retorna HTTP 404

#### Escenari: La petició no autenticada és rebutjada
- **QUAN** la petició no té JWT
- **ALESHORES** el sistema retorna HTTP 401

#### Escenari: El rol CLIENT no pot accedir a aquest endpoint
- **QUAN** s'usa un JWT amb rol CLIENT
- **ALESHORES** el sistema retorna HTTP 403

#### Escenari: Testabilitat — test unitari Jest
- **QUAN** `ProgressService.getClientSessionHistory(coachId, clientId)` es crida i el Prisma mockat no retorna sessions per a aquell coachId
- **ALESHORES** el mètode llança `NotFoundException`

---

### Requisit: El client pot veure el seu propi historial de sessions
El sistema HA DE proporcionar un endpoint `GET /progress/client/sessions` que retorni les sessions completades pròpies del client autenticat (tant en solitari com cooperatives), incloent el nom de la rutina, la data de finalització i el percentatge de compleció.

#### Escenari: El client obté la seva llista de sessions
- **QUAN** un client envia `GET /progress/client/sessions` amb un JWT vàlid
- **ALESHORES** el sistema retorna HTTP 200 amb `{ sessions: [{ id, routineName, completedAt, completionPercentage }] }` ordenat per `completedAt` descendent

#### Escenari: Les sessions en solitari s'inclouen
- **QUAN** el client té sessions en solitari completades (LiveSession on coachId ÉS NULL i la rutina li és assignada)
- **ALESHORES** aquelles sessions apareixen a la resposta

#### Escenari: Les sessions cooperatives s'inclouen
- **QUAN** el client apareix com a LiveParticipant en una LiveSession COMPLETED
- **ALESHORES** aquella sessió també apareix a la resposta

#### Escenari: Les sessions PENDING o ACTIVE s'exclouen
- **QUAN** el client té sessions en curs no COMPLETED
- **ALESHORES** aquelles sessions NO apareixen a la llista d'historial

#### Escenari: La petició no autenticada és rebutjada
- **QUAN** no es proporciona JWT
- **ALESHORES** el sistema retorna HTTP 401

#### Escenari: El rol COACH no pot accedir a l'historial de sessions del client
- **QUAN** s'usa un JWT amb rol COACH
- **ALESHORES** el sistema retorna HTTP 403

#### Escenari: Testabilitat — QA manual
- **QUAN** un client de prova completa un entrenament en solitari via la UI i després crida `GET /progress/client/sessions`
- **ALESHORES** la sessió completada apareix al capdamunt de la llista retornada amb `completedAt` establert

---

### Requisit: El client pot veure estadístiques d'entrenament agregades
El sistema HA DE proporcionar un endpoint `GET /progress/client/stats` que retorni els totals agregats del client autenticat: total de sessions completades, total de sèries completades i total d'exercicis completats.

#### Escenari: Client amb sessions completades obté estadístiques reals
- **QUAN** un client envia `GET /progress/client/stats` i té 5 sessions completades
- **ALESHORES** el sistema retorna HTTP 200 amb `{ totalSessions: 5, totalSets: <suma>, totalExercises: <suma> }`

#### Escenari: Client sense sessions completades obté zeros
- **QUAN** el client no té sessions COMPLETED
- **ALESHORES** el sistema retorna HTTP 200 amb `{ totalSessions: 0, totalSets: 0, totalExercises: 0 }`

#### Escenari: Els camps de compleció null es comptabilitzen com a zero
- **QUAN** algunes sessions anteriors al canvi d'schema tenen `completedSets` / `completedExercises` null
- **ALESHORES** aquells nulls es tracten com a 0 en l'agregació (no s'exposen com a null a la resposta)

#### Escenari: La petició no autenticada és rebutjada
- **QUAN** no es proporciona JWT
- **ALESHORES** el sistema retorna HTTP 401

#### Escenari: El rol COACH no pot accedir a les stats del client
- **QUAN** s'usa un JWT amb rol COACH
- **ALESHORES** el sistema retorna HTTP 403

#### Escenari: Testabilitat — test unitari Jest
- **QUAN** `ProgressService.getClientStats(clientId)` es crida amb un Prisma mockat que retorna sessions amb `completedSets` mixt null/no-null
- **ALESHORES** el mètode retorna `{ totalSessions, totalSets, totalExercises }` amb els nulls tractats com a 0

---

### Requisit: La finalització de sessió persisteix les mètriques de resum
El sistema HA DE persistir `completionPercentage`, `completedSets` i `completedExercises` a `LiveSession` quan una sessió transiciona a l'estat COMPLETED, perquè els endpoints d'historial puguin retornar dades precises.

#### Escenari: El payload de finalització es desa en completar la sessió
- **QUAN** `updateSessionStatus` es crida amb `status = COMPLETED` i un cos que conté `{ completionPercentage: 85, completedSets: 12, completedExercises: 4 }`
- **ALESHORES** la fila `LiveSession` s'actualitza amb aquells valors juntament amb `status = COMPLETED` i `completedAt = now()`

#### Escenari: Els camps de compleció absents queden com a null
- **QUAN** `updateSessionStatus` es crida amb `status = COMPLETED` i sense stats de compleció al cos
- **ALESHORES** els camps romanen null i la sessió queda marcada com COMPLETED igualment

#### Escenari: Testabilitat — test unitari Jest
- **QUAN** `SessionService.updateSessionStatus` s'invoca amb stats de compleció i un Prisma mockat
- **ALESHORES** el `liveSession.update` mockat es crida amb `completionPercentage`, `completedSets` i `completedExercises` al payload `data`
