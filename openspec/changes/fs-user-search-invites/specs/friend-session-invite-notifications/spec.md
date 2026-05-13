# Especificació: friend-session-invite-notifications

## Requisits AFEGITS

### Requisit: Invitant rep notificació en temps real quan s'envia invitació

El sistema HA DE emetre una notificació Socket.IO a la sala `user:{userId}` de l'invitant quan es rep una invitació.

#### Escenari: Notificació és lliurada a invitant en línia
- **GIVEN** usuari Alice (CLIENT) i Bob (CLIENT) ambdós connectats
- **GIVEN** Alice envia una invitació a Bob via `POST /api/friend-invitations/send`
- **WHEN** la invitació és creada
- **THEN** el servidor emet esdeveniment `friend-invite:notify` a sala `user:Bob.id`
- **THEN** el payload d'esdeveniment inclou `{ invitationId, inviterId, inviter: { id, username }, expiresAt }`

#### Escenari: Notificació no és lliurada si invitant està offline
- **GIVEN** usuari Alice envia invitació a usuari Charlie (offline)
- **WHEN** la creació d'invitació falla amb HTTP 400 "User is offline"
- **THEN** cap esdeveniment de notificació és emès

#### Escenari: Múltiples invitacions pendents generen cada una la seva pròpia notificació
- **GIVEN** usuari Alice i Charlie ambdós envien invitacions a Bob
- **WHEN** ambdues invitacions són enviades
- **THEN** Bob rep dos esdeveniments `friend-invite:notify` separats
- **THEN** cada esdeveniment conté el inviterId correcte (Alice i Charlie respectivament)

### Requisit: Invitant rep confirmació quan invitació és acceptada

El sistema HA DE emetre una notificació a l'invitant quan la seva invitació és acceptada.

#### Escenari: Invitant rep confirmació d'acceptar
- **GIVEN** Bob va rebre prèviament una invitació d'Alice
- **WHEN** Bob crida `PATCH /api/friend-invitations/{invitationId}/accept`
- **THEN** el servidor emet esdeveniment `friend-invite:accepted` a sala `user:Alice.id`
- **THEN** el payload d'esdeveniment inclou `{ invitationId, inviteeId, invitee: { id, username }, sessionCode }`
- **THEN** l'app d'Alice rep la notificació i pot actualitzar la UI o descartar invitació pendent

#### Escenari: Invitant pot unir-se a sessió immediatament després d'acceptar
- **GIVEN** Alice rep la notificació `friend-invite:accepted` amb `sessionCode`
- **WHEN** l'app d'Alice rep aquest esdeveniment
- **THEN** l'app d'Alice pot immediatament emetre `room:join` amb el `sessionCode` proporcionat
- **THEN** Alice s'uneix a la sessió sense necessitat de refrescar o introduir codi manualment

#### Escenari: Invitant rep notificació fins i tot si està en pàgina diferent
- **GIVEN** Alice està a la pàgina de rutines (no al lobby de sessió d'amics)
- **GIVEN** Bob accepta invitació d'Alice
- **WHEN** `friend-invite:accepted` és emès a `user:Alice.id`
- **THEN** l'app d'Alice rep la notificació (és global, no específica de pàgina)
- **THEN** apareix una notificació toast, informant Alice que Bob va acceptar

### Requisit: Invitant rep notificació quan invitació és rebutjada

El sistema HA DE emetre una notificació a l'invitant quan la seva invitació és rebutjada.

#### Escenari: Invitant rep notificació de rebutjar
- **GIVEN** Bob va rebre prèviament una invitació d'Alice
- **WHEN** Bob crida `PATCH /api/friend-invitations/{invitationId}/reject`
- **THEN** el servidor emet esdeveniment `friend-invite:rejected` a sala `user:Alice.id`
- **THEN** el payload d'esdeveniment inclou `{ invitationId, inviteeId, invitee: { id, username }, reason: "rejected" }`

#### Escenari: Invitació rebutjada és eliminada de la llista pendent de l'invitant
- **GIVEN** Alice veu la seva invitació pendent a Bob a la UI
- **WHEN** arriba la notificació `friend-invite:rejected`
- **THEN** la UI d'Alice s'actualitza per eliminar la invitació de la seva llista pendent

### Requisit: Lliurament de notificació és resilient a temporització

El sistema HA DE gestionar escenaris on notificacions poden arribar abans o després de canvis d'estat UI.

#### Escenari: Notificació arriba després que invitant accepti
- **GIVEN** Bob ha acceptat una invitació
- **GIVEN** però la seva resposta `accept` encara no ha retornat al client de Bob
- **WHEN** arriba la notificació `friend-invite:accepted` d'Alice des de Socket.IO
- **THEN** el client d'Alice no duplica l'entrada o corromp estat
- **THEN** Alice rep la notificació sense confusió sobre l'estat

#### Escenari: Notificació no apareix si destinatari es desconnecta abans de lliurament
- **GIVEN** el socket d'Alice està a punt de rebre `friend-invite:notify`
- **GIVEN** l'app d'Alice es bloqueja en aquest moment exacte
- **WHEN** Alice es reconnecta i inicia sessió de nou
- **THEN** l'app d'Alice consulta `GET /api/friend-invitations/pending` per restaurar invitacions pendents
- **THEN** la invitació apareix (encara que la notificació en temps real es va perdre)

### Requisit: Notificacions s'integren amb NotificationContext

El sistema HA DE mostrar notificacions de sessió d'amics al centre de notificacions global de l'app.

#### Escenari: Notificació toast per invitació rebuda
- **GIVEN** Bob rep un esdeveniment `friend-invite:notify`
- **WHEN** l'esdeveniment és processat pel listener global d'App.tsx
- **THEN** es crida `NotificationContext.addNotification()`
- **THEN** apareix un toast: "[username] invited you to a friend session"
- **THEN** el toast persisteix per 5 segons (timeout de toast per defecte)

#### Escenari: Notificació toast per invitació acceptada
- **GIVEN** Alice rep un esdeveniment `friend-invite:accepted`
- **WHEN** l'esdeveniment és processat pel listener d'App.tsx
- **THEN** apareix un toast: "[username] accepted your friend session invitation"

#### Escenari: Notificació toast per invitació rebutjada
- **GIVEN** Alice rep un esdeveniment `friend-invite:rejected`
- **WHEN** l'esdeveniment és processat pel listener d'App.tsx
- **THEN** apareix un toast: "[username] declined your friend session invitation"

### Requirement: Socket.IO event structure and payloads

The system SHALL emit friend session events with consistent and well-defined payloads.

#### Scenario: friend-invite:notify payload structure
- **WHEN** Alice sends invitation to Bob
- **THEN** the event payload follows: 
  ```json
  {
    "invitationId": 42,
    "inviterId": 1,
    "inviter": {
      "id": 1,
      "username": "alice_coach"
    },
    "expiresAt": "2026-05-13T14:35:00Z"
  }
  ```

#### Scenario: friend-invite:accepted payload structure
- **WHEN** Bob accepts invitation
- **THEN** the event payload follows:
  ```json
  {
    "invitationId": 42,
    "inviteeId": 2,
    "invitee": {
      "id": 2,
      "username": "bob_athlete"
    },
    "sessionCode": "abc-123-def-456"
  }
  ```

#### Scenario: Events are emitted to correct Socket.IO room
- **GIVEN** invitation involves Alice (userId: 1) and Bob (userId: 2)
- **WHEN** invitation is sent
- **THEN** `friend-invite:notify` is emitted to room `user:2` (Bob's personal room)
- **WHEN** Bob accepts
- **THEN** `friend-invite:accepted` is emitted to room `user:1` (Alice's personal room)

### Requirement: Error handling in notification delivery

The system SHALL gracefully handle errors during notification emission.

#### Scenario: Server error in notification emit does not rollback invitation
- **GIVEN** Alice sends invitation to Bob
- **GIVEN** the invitation is created successfully in database
- **WHEN** Socket.IO `.to("user:Bob").emit()` fails (e.g. network issue)
- **THEN** the invitation is still persisted and status is PENDING
- **THEN** the HTTP response to Alice is still HTTP 201 (invitation created)
- **THEN** Bob can still see the invitation when they refresh or query `GET /api/friend-invitations/pending`

#### Scenario: Malformed Socket.IO event does not crash the server
- **GIVEN** a Socket.IO client sends a malformed `friend-invite:send` event
- **WHEN** the server receives it
- **THEN** the server validates and rejects the event
- **THEN** the server continues to accept valid events from other clients

## Testability

**Jest Unit Test Approach:**
- Mock `socket.io` server instance: `io.to(room).emit()`
- Spy on `.emit()` calls to verify correct event, room, and payload structure
- Test each notification event (notify, accepted, rejected) separately
- Mock `PrismaService` to verify database state before and after notification
- Assert HTTP response codes and event emissions are atomic

**Socket.IO Integration Test (if added):**
- Use `socket.io-client` test library to connect two virtual clients
- Client A sends invitation to Client B via HTTP POST
- Verify Client B's socket receives `friend-invite:notify` event with correct payload
- Client B accepts via HTTP PATCH
- Verify Client A's socket receives `friend-invite:accepted` event with correct payload
- Verify session code is included and valid

**Manual QA Steps (add to `doc/Proves_usuari.md`):**
1. Open two browsers: one logged in as Alice, one as Bob
2. In Alice's browser, navigate to Friend Session Lobby and search for Bob
3. Alice clicks "Invite" on Bob
4. Verify a toast appears in Bob's browser: "[Alice] invited you to a friend session"
5. Bob clicks accept in the notification or in the UI
6. Verify a toast appears in Alice's browser: "[Bob] accepted your friend session invitation"
7. Verify both Alice and Bob are now in the same session
8. In a third browser, log in as Charlie
9. Send Charlie an invitation from Bob
10. Verify Charlie sees the notification
11. Verify both Alice (logged out) does NOT see the notification (she's not the inviter)

**Note on Testing Resilience:**
- Test that notifications survive app refresh: reload Bob's browser while invitation is pending; verify invitation still appears in pending list
- Test that notifications appear even when recipient is on a different page: Alice sends invitation while Bob is on the routines page; verify toast appears regardless of page
