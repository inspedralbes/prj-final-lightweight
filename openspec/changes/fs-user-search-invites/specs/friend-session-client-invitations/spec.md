# Especificació: friend-session-client-invitations

## Requisits AFEGITS

### Requisit: Client pot enviar invitació de sessió d'amics

El sistema HA DE permetre que un client connectat enviï una invitació d'entrenament de sessió d'amics a un altre usuari en línia.

#### Escenari: Creació d'invitació exitosa
- **GIVEN** usuari Alice (CLIENT) està connectat
- **GIVEN** usuari Bob (CLIENT) està connectat
- **WHEN** Alice crida `POST /api/friend-invitations/send` amb body `{ inviteeId: Bob.id }`
- **THEN** la resposta és HTTP 201 Created
- **THEN** la resposta inclou `{ id, inviterId, inviteeId, status: "PENDING", createdAt, expiresAt }`
- **THEN** expiresAt és 5 minuts en el futur

#### Escenari: No es pot enviar invitació a un usuari offline
- **GIVEN** usuari Alice (CLIENT) està connectat
- **GIVEN** usuari Charlie no està connectat (desconnectat)
- **WHEN** Alice crida `POST /api/friend-invitations/send` amb `inviteeId: Charlie.id`
- **THEN** la resposta és HTTP 400 Bad Request amb error "User is offline"

#### Escenari: Usuari no autenticat no pot enviar invitacions
- **GIVEN** usuari no està autenticat
- **WHEN** usuari crida `POST /api/friend-invitations/send` amb dades d'invitant
- **THEN** la resposta és HTTP 401 Unauthorized

#### Escenari: Usuari no pot enviar invitació a si mateix
- **GIVEN** usuari Alice (CLIENT) està connectat
- **WHEN** Alice crida `POST /api/friend-invitations/send` amb `inviteeId: Alice.id`
- **THEN** la resposta és HTTP 400 Bad Request amb error "Cannot send invitation to yourself"

### Requisit: Prevenir invitacions pendents duplicades

El sistema NO HA DE permetre múltiples invitacions pendents entre el mateix invitant i invitant.

#### Escenari: Invitació duplicada és rebutjada
- **GIVEN** usuari Alice ja ha enviat una invitació pendent a Bob
- **WHEN** Alice crida `POST /api/friend-invitations/send` amb `inviteeId: Bob.id` de nou
- **THEN** la resposta és HTTP 409 Conflict amb error "You already have a pending invitation with this user"

#### Escenari: Invitació pot ser reenviada després que l'anterior expiri
- **GIVEN** usuari Alice va enviar una invitació a Bob que ara ha expirat (status: EXPIRED)
- **WHEN** Alice crida `POST /api/friend-invitations/send` amb `inviteeId: Bob.id`
- **THEN** la resposta és HTTP 201 Created amb una nova invitació

#### Escenari: Invitació pot ser reenviada després de rebutjar
- **GIVEN** Bob va rebutjar prèviament una invitació d'Alice
- **WHEN** Alice crida `POST /api/friend-invitations/send` amb `inviteeId: Bob.id`
- **THEN** la resposta és HTTP 201 Created amb una nova invitació

### Requisit: Invitant pot acceptar invitació

El sistema HA DE permetre que un invitant accepti una invitació de sessió d'amics.

#### Escenari: Acceptació d'invitació exitosa
- **GIVEN** Bob té una invitació pendent d'Alice
- **WHEN** Bob crida `PATCH /api/friend-invitations/{invitationId}/accept`
- **THEN** la resposta és HTTP 200 OK
- **THEN** l'estat d'invitació s'actualitza a "ACCEPTED"
- **THEN** la resposta inclou la invitació amb `status` i `updatedAt` actualitzats

#### Escenari: No es pot acceptar invitació expirada
- **GIVEN** Bob té una invitació d'Alice que ha expirat (status: EXPIRED)
- **WHEN** Bob crida `PATCH /api/friend-invitations/{invitationId}/accept`
- **THEN** la resposta és HTTP 410 Gone amb error "Invitation has expired"

#### Escenari: No es pot acceptar invitació destinada a algú altre
- **GIVEN** invitació pertany a Bob (inviteeId: Bob.id)
- **WHEN** Charlie crida `PATCH /api/friend-invitations/{invitationId}/accept`
- **THEN** la resposta és HTTP 403 Forbidden amb error "You are not the invitee"

### Requisit: Invitant pot rebutjar invitació

El sistema HA DE permetre que un invitant rebutgi una invitació de sessió d'amics.

#### Escenari: Rebuig d'invitació exitós
- **GIVEN** Bob té una invitació pendent d'Alice
- **WHEN** Bob crida `PATCH /api/friend-invitations/{invitationId}/reject`
- **THEN** la resposta és HTTP 200 OK
- **THEN** l'estat d'invitació s'actualitza a "REJECTED"
- **THEN** la resposta inclou timestamp `updatedAt`

#### Escenari: No es pot rebutjar invitació expirada
- **GIVEN** Bob té una invitació expirada d'Alice
- **WHEN** Bob crida `PATCH /api/friend-invitations/{invitationId}/reject`
- **THEN** la resposta és HTTP 410 Gone amb error "Invitation has expired"

#### Escenari: No es pot rebutjar invitació dues vegades
- **GIVEN** Bob ja ha rebutjat una invitació d'Alice
- **WHEN** Bob crida `PATCH /api/friend-invitations/{invitationId}/reject` de nou
- **THEN** la resposta és HTTP 400 Bad Request amb error "Invitation is already rejected"

### Requisit: Usuari pot obtenir invitacions pendents

El sistema HA DE permetre que un usuari recuperi les seves invitacions pendents rebudes.

#### Escenari: Obtenir invitacions pendents rebudes
- **GIVEN** Bob té invitacions pendents d'Alice i Charlie
- **WHEN** Bob crida `GET /api/friend-invitations/pending`
- **THEN** la resposta és HTTP 200 OK
- **THEN** la resposta inclou ambdues invitacions pendents
- **THEN** cada invitació inclou `{ id, inviterId, inviter: { id, username, role }, status: PENDING, createdAt, expiresAt }`

#### Escenari: Obtenir exclou invitacions no pendents
- **GIVEN** Bob té 1 invitació pendent i 1 expirada, 1 acceptada, 1 rebutjada
- **WHEN** Bob crida `GET /api/friend-invitations/pending`
- **THEN** només la invitació pendent és retornada

#### Escenari: Usuari no autenticat no pot obtenir invitacions
- **GIVEN** usuari no està autenticat
- **WHEN** usuari crida `GET /api/friend-invitations/pending`
- **THEN** la resposta és HTTP 401 Unauthorized

### Requisit: Invitacions auto-expiren després de 5 minuts

El sistema HA DE marcar automàticament invitacions com EXPIRED si no són acceptades o rebutjades dins de 5 minuts.

#### Escenari: Invitació expirada és marcada a la base de dades
- **GIVEN** una invitació va ser creada fa 6 minuts
- **WHEN** una tasca de fons o avaluació lazy comprova la invitació
- **THEN** l'estat d'invitació és establert a "EXPIRED"
- **NOTE** Implementació pot utilitzar una tasca programada o actualització lazy en lectura

#### Escenari: Invitacions expirades no apareixen a la llista pendent
- **GIVEN** Bob té una invitació pendent que va expirar fa 1 minut
- **WHEN** Bob crida `GET /api/friend-invitations/pending`
- **THEN** la invitació expirada no apareix a la llista

### Requisit: Persistència de dades i consistència

El sistema HA DE emmagatzemar totes les invitacions a la base de dades amb seguiment d'estat adequat.

#### Escenari: Invitació persisteix després de recàrrega
- **GIVEN** Bob rep una invitació d'Alice
- **GIVEN** Bob tanca i reobre l'app
- **WHEN** Bob carrega l'app
- **THEN** la invitació encara és visible a la llista pendent

#### Escenari: Invitació acceptada és registre permanent
- **GIVEN** Alice i Bob han completat una sessió d'amics després d'acceptar una invitació
- **WHEN** consultant història d'invitacions setmanes després
- **THEN** el registre d'invitació amb estat ACCEPTED encara és a la base de dades

## Testabilitat

**Enfocament de Test Unitari Jest:**
- Mock `PrismaService.friendInvitation.create()`, `.update()`, `.findMany()`, `.findUnique()`
- Mock comprovació de connexió socket (via un `connectedUsersService` o similar)
- Assert prevenció de duplicats via restricció única en (inviterId, inviteeId, status: PENDING)
- Assert codis d'estat HTTP (201, 400, 409, 403, 410)
- Assert timestamp d'expiració és establert a now + 5 minuts

**Tasca de Fons per Expiració (si implementada):**
- Crear una tasca `@Cron()` de NestJS que s'executi cada minut
- Consultar invitacions on `status = PENDING` AND `expiresAt <= NOW()`
- Actualitzar-les a `status = EXPIRED`
- Test Jest: mock `@nestjs/schedule` i verificar tasca s'executa i actualitza registres

**Passos QA Manuals (afegir a `doc/Proves_usuari.md`):**
1. Iniciar sessió com Usuari A i Usuari B en navegadors separats
2. Usuari A envia invitació a Usuari B
3. Verificar Usuari B veu la notificació i invitació pendent apareix a la seva UI
4. Usuari B accepta la invitació
5. Verificar ambdós usuaris ara són a la Friend Session
6. Usuari A envia una altra invitació a Usuari B
7. Esperar 5 minuts sense que Usuari B respongui
8. Verificar la invitació desapareix de la llista pendent d'Usuari B
9. Usuari A intenta enviar una altra invitació a Usuari B — verificar té èxit (l'anterior és expirada)

**Client de Test Socket.IO (si disponible):**
- Emitir esdeveniments `friend-invite:accept` o `friend-invite:reject` via client de test
- Verificar servidor persisteix canvi d'estat a base de dades
- Verificar servidor emet esdeveniment de notificació corresponent
