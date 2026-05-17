# Spec: Client Friend Stats

## Propòsit

Proporciona un endpoint API (`GET /progress/client/friend-stats`) i la seva representació a la interfície web que mostra estadístiques específiques de les sessions cooperatives (Friend Sessions) del client autenticat: nombre total de sessions amb amics, sèries, exercicis, i un desglossament per company de training (username + nombre de sessions compartides). Tots dos participants d'una sessió cooperativa veuen les mateixes estadístiques cooperatives als seus respectius perfils.

## Requisits

### Requisit: El client pot obtenir estadístiques de Friend Sessions
El sistema HA DE proporcionar un endpoint `GET /progress/client/friend-stats` que retorni els totals cooperatius i el desglossament per company del client autenticat.

#### Escenari: El client amb sessions cooperatives obté estadístiques reals
- **QUAN** un client envia `GET /progress/client/friend-stats` amb un JWT vàlid
- **ALESHORES** el sistema retorna HTTP 200 amb `{ totalCoopSessions, totalCoopSets, totalCoopExercises, partners }`

#### Escenari: El client sense sessions cooperatives obté zeros i llista buida
- **QUAN** el client no té sessions cooperatives completades
- **ALESHORES** el sistema retorna HTTP 200 amb `{ totalCoopSessions: 0, totalCoopSets: 0, totalCoopExercises: 0, partners: [] }`

#### Escenari: Els companys es retornen amb username i nombre de sessions
- **QUAN** el client ha fet 3 sessions cooperatives amb "pep" i 2 amb "maria"
- **ALESHORES** `partners` conté `{ username: "pep", sessionCount: 3 }` i `{ username: "maria", sessionCount: 2 }`

#### Escenari: Els companys s'ordenen per nombre de sessions descendent
- **QUAN** la resposta conté múltiples companys
- **ALESHORES** el array `partners` està ordenat per `sessionCount` descendent

#### Escenari: La petició no autenticada és rebutjada
- **QUAN** no es proporciona JWT
- **ALESHORES** el sistema retorna HTTP 401

#### Escenari: El rol COACH no pot accedir a l'endpoint de friend stats del client
- **QUAN** s'usa un JWT amb rol COACH
- **ALESHORES** el sistema retorna HTTP 403

#### Escenari: Testabilitat — Jest unit test
- **QUAN** `ProgressService.getClientFriendStats(clientId)` es crida amb un Prisma mockat que retorna 2 sessions cooperatives amb 3 i 2 participants respectivament
- **ALESHORES** el mètode retorna `totalCoopSessions: 2` i `partners` amb els usernames correctes

---

### Requisit: La interfície mostra la secció de Friend Stats
El sistema HA DE mostrar una targeta d'estadístiques cooperatives a la pàgina `/client/history` que mostri els totals cooperatius i la llista de companys.

#### Escenari: El client amb estadístiques cooperatives veu la targeta amb dades
- **QUAN** `GET /progress/client/friend-stats` retorna dades cooperatives
- **ALESHORES** la targeta "Friend Stats" renderitza `totalCoopSessions`, `totalCoopSets`, `totalCoopExercises` i la llista de `partners` amb el username i `sessionCount` de cadascun

#### Escenari: El client sense estadístiques cooperatives veu la targeta amb zeros
- **QUAN** `GET /progress/client/friend-stats` retorna `{ totalCoopSessions: 0, ... }`
- **ALESHORES** la targeta mostra `0` en tots els comptadors i "—" o llista buida en companys

#### Escenari: La petició falla mostra un toast d'error
- **QUAN** `GET /progress/client/friend-stats` retorna un error
- **ALESHORES** la pàgina mostra un toast d'error usant `useToast` amb la clau `messages.errorOccurred`

#### Escenari: i18n — les claus existeixen en tots els idiomes
- **QUAN** la pàgina es renderitza en català, castellà o anglès
- **ALESHORES** cada etiqueta de la targeta Friend Stats s'obté de les claus de localització `history.friendStats.*`