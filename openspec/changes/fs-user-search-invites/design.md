## Context

Actualment, Friend Session es basa en un mecanisme manual de compartició de codis: un client genera un codi de sessió, el comparteix fora de banda (verbalment, xat, etc.), i l'altre client l'introdueix per unir-se. Això crea fricció i punts de fricció:

- Els usuaris han d'intercanviar i recordar codis activament
- La validació de codi és unidireccional (sense confirmació de qui s'uneix)
- El descobriment de socis de co-entrenament disponibles és manual i extern a l'app

El sistema d'invitacions coach-client (base LW-124) ja implementa un patró més sofisticat:
- Coach cerca client per nom/nom d'usuari
- Coach envia una invitació
- Client rep una notificació en temps real amb opcions d'acceptar/rebutjar
- Les invitacions acceptades condueixen a unió automàtica de sessió

**Objectiu d'aquest disseny**: Replicar el patró coach-client per sessions client-client (amics), utilitzant el mateix mecanisme de notificacions Socket.IO i patró UX.

## Goals / Non-Goals

**Goals:**
- Proporcionar una interfície de cerca d'usuaris que filtri només usuaris en línia (actualment connectats)
- Permetre que els clients enviïn invitacions als usuaris seleccionats sense intercanviar codis
- Lliurar notificacions en temps real als invitants utilitzant la sala Socket.IO `user:{userId}` existent
- Auto-unir ambdues parts a una Friend Session en acceptar invitació (sense entrada manual de codi)
- Rastrejar cicle de vida d'invitació (pendent, acceptada, rebutjada, expirada)
- Prevenir invitacions simultànies duplicades (mateixa parella inviter-invitee)
- Mantenir flux d'invitacions coach-client existent sense canvis

**Non-Goals:**
- Llistes d'amics persistents o gràfic social
- Programació avançada (les invitacions han de ser síncrones, és a dir, ambdós usuaris en línia)
- Integració de videotrucada amb sessions d'amics
- Respostes d'invitació o missatgeria dins la UI d'invitació
- Limitació de taxa o detecció de spam (fora d'abast per MVP)
- Modificar arquitectura coop-session o LiveSession

## Decisions

### 1. Reuse Invitation Model with Type Discriminator vs. New FriendInvitation Table

**Decision**: Crear un nou model `FriendInvitation` separat del model `Invitation` existent.

**Rationale**:
- Les invitacions coach-client tenen lògica específica de domini (validació coach, acceptació client, notes basades en perfil).
- Les invitacions de sessió d'amics tenen semàntiques diferents (peer-to-peer, auto-expiren en timeout, sense context de perfil).
- Separar models evita acoblament i facilita evolucionar cada flux independentment.
- Rendiment de consulta: no cal filtrar discriminadors de tipus quan cerquem invitacions d'amics.

**Alternative considered**: Estendre `Invitation` amb un enum `type` i camps addicionals nullable. Rebutjat perquè contaminaria la lògica coach-client i afegiria complexitat nullable.

### 2. Online User Detection: Socket.IO Presence vs. Explicit Presence Events

**Decision**: Aprofitar connexió socket existent d'EventsGateway com presència implícita.

**Rationale**:
- Cada usuari autenticat s'uneix a la sala `user:{userId}` en connectar socket (ja implementat).
- Quan cerquem, consultar backend per "usuaris amb almenys una connexió socket activa" utilitzant `io.to(room).allSockets()` o un conjunt simple d'usuaris connectats en memòria.
- Això evita afegir esdeveniments explícits `user:online` / `user:offline` i consultes DB.
- La presència és efímera (sense persistència DB necessària).

**Alternative considered**: Persistir presència en Redis o PostgreSQL. Rebutjat per MVP perquè la connexió socket ja proporciona el senyal.

### 3. User Search Endpoint: /api/users/search vs. /api/friend-invitations/search-users

**Decision**: Crear un nou endpoint REST `/api/users/search` amb params de consulta `?q=name` i filtre de rol (per defecte: tant COACH com CLIENT).

**Rationale**:
- L'endpoint és de propòsit general (pot reutilitzar-se per altres característiques de cerca d'usuaris en futur).
- Format de resposta: `{ id, username, role }` (PII mínim).
- Només retorna usuaris amb connexions socket actives.
- Límit de consulta: 10 resultats (per prevenir conjunts de resultats grans).

**Alternative considered**: Retornar una llista en caché de tots els usuaris cada 5 segons. Rebutjat perquè el polling és ineficient i menys en temps real.

### 4. Invitation Lifecycle and Timeout: Expire After X Minutes vs. Explicit Cancellation

**Decision**: Invitació auto-expira 5 minuts després de creació si no acceptada o rebutjada.

**Rationale**:
- Prevé invitacions estancades que emboliquen la UI.
- 5 minuts és prou llarg perquè un usuari noti una notificació (toast + modal persistent opcional).
- Coincideix amb patrons UX típics de xat en temps real.

**Alternative considered**: Vida infinita fins rebutjada o cancel·lada explícitament. Rebutjat perquè podria causar confusió si els usuaris obliden invitacions pendents antigues.

### 5. Notification Delivery: Socket.IO Event vs. Traditional HTTP Notification Endpoint

**Decision**: Emetre `friend-invite:notify` a la sala `user:{inviteeId}` via Socket.IO.

**Rationale**:
- Lliurament en temps real (sense polling).
- S'alinea amb patró de notificacions existent (invitacions de videotrucada ja utilitzen això).
- Notificació persistent en NotificationContext permet visualització toast/modal a través de navegació de pàgina.
- No cal nou endpoint HTTP.

**Alternative considered**: Crear un endpoint HTTP `/api/friend-invitations/pending` per polling. Rebutjat perquè Socket.IO ja és la columna vertebral en temps real de l'app.

### 6. Session Join After Acceptance: Reuse Existing session:{sessionCode} Room vs. New Friend Channel

**Decision**: Reutilitzar la sala `session:{sessionCode}` existent i cicle de vida LiveSession.

**Rationale**:
- Les sessions d'amics SÓN sessions co-op; no cal nou tipus de sessió.
- RoomGateway existent gestiona unió, sincronització d'estat, i progrés d'exercici per tots els tipus de sessió.
- No cal nous tipus d'esdeveniment Socket.IO per mecàniques de sessió.
- Arquitectura més neta: les invitacions són un mecanisme de descobriment, no un tipus de sessió.

**Alternative considered**: Crear una sala separada `friend-session:{id}`. Rebutjat perquè duplica lògica RoomGateway.

### 7. Database Schema: Minimal vs. Rich Invitation Metadata

**Decision**: Esquema FriendInvitation mínim amb només inviterId, inviteeId, status, createdAt, expiresAt.

**Rationale**:
- Mantenir gestió d'estat simple: invitació té un de {PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED}.
- Sense metadades de sessió emmagatzemades en la invitació (sessionCode es genera en acceptar, no emmagatzemat en invitació).
- Més fàcil consultar: sense referències de sessió nullable.

**Schema**:
```prisma
model FriendInvitation {
  id        Int      @id @default(autoincrement())
  inviterId Int
  inviteeId Int
  status    FriendInvitationStatus @default(PENDING)
  createdAt DateTime @default(now())
  expiresAt DateTime
  updatedAt DateTime @updatedAt

  inviter   User @relation("FriendInvitations_inviter", fields: [inviterId], references: [id], onDelete: Cascade)
  invitee   User @relation("FriendInvitations_invitee", fields: [inviteeId], references: [id], onDelete: Cascade)

  @@unique([inviterId, inviteeId, status]) // Prevent multiple pending invitations between same pair
  @@index([inviteeId, status])
}

enum FriendInvitationStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
  CANCELLED
}
```

### 8. Frontend Architecture: New Workout Feature vs. Separate Friend Sessions Feature

**Decision**: Crear una nova pàgina `FriendSessionLobby` dins la característica `workout`.

**Rationale**:
- Les sessions d'amics són una variant de sessions co-op; pertanyen a la característica `workout`.
- Manté cerca d'usuaris i invitacions co-localitzades amb lògica d'entrada de sessió.
- Reutilitza singleton socket i flux d'unió de sala existent.
- Routing més simple que una característica `friend-sessions` separada.

**Alternative considered**: Crear `src/front/src/features/friend-sessions/`. Rebutjat perquè crea un sibling de característica nou quan el concepte core (unió de sessió co-op) ja existeix en `workout`.

### 9. Duplicate Invitation Prevention: Unique Constraint vs. Application Logic

**Decision**: Utilitzar una restricció única de base de dades en (inviterId, inviteeId, status) per prevenir duplicats.

**Rationale**:
- Aplicació a nivell de base de dades és més fiable que lògica d'aplicació.
- La restricció només aplica a invitacions PENDING (invitacions acceptades/rebutjades poden repetir-se).
- Simple: afegir `@@unique([inviterId, inviteeId, status])` a l'esquema Prisma.

**Alternative considered**: Comprovació a nivell d'aplicació en el servei. Rebutjat perquè no és atòmic i pot córrer en sol·licituds concurrents.

### 10. Notification Persistence: Toast Only vs. Toast + Persistent Modal

**Decision**: Lliurar via esdeveniment Socket.IO; NotificationContext decideix UI (toast apareix immediatament, sense override modal necessari per MVP).

**Rationale**:
- Notificacions toast són no intrusives i coincideixen amb UX d'invitacions de xat/trucada existent.
- Si l'usuari està en una altra pàgina, encara veu el toast (NotificationContext és global).
- Modal de confirmació és excessiu per MVP; MVP se centra en descobriment, no refinament UX.

## Risks / Trade-offs

**[Risk] Socket Connection as Presence Signal**
- **Problem**: Si l'app d'un usuari es bloqueja o tanca abruptament, el seu socket pot no desconnectar immediatament (fins timeout).
- **Mitigation**: Timeout de socket (per defecte 60s en Socket.IO) és acceptable per cerca d'usuaris. Els usuaris no s'esperen romandre visibles >1 minut després de logout.
- **Trade-off**: Més simple que rastreig de presència explícit, latència acceptable.

**[Risk] Race Condition: Invitation Sent But Invitee Disconnects Before Notification Arrives**
- **Problem**: Invitació persistida, però esdeveniment Socket mai lliurat.
- **Mitigation**: Lliurament de notificació és fire-and-forget; l'invitant encara pot veure invitacions pendents actualitzant la pàgina o comprovant un endpoint `/api/friend-invitations/pending` (a afegir si necessari).
- **Trade-off**: MVP accepta pèrdua de notificació; versió futura pot afegir comprovació de notificació HTTP fallback en inici d'app.

**[Risk] 5-Minute Timeout May Be Too Long for Mobile Users**
- **Problem**: Usuari rep invitació, tanca app, torna després de 6 minuts, invitació ha expirat.
- **Mitigation**: Timeout és configurable (env var `FRIEND_INVITATION_TTL_SECONDS`). Pot reduir-se a 2-3 minuts basat en feedback UX.
- **Trade-off**: Timeout més curt = pèrdua d'invitació més alta d'usuaris que s'allunyen breument.

**[Risk] User Search Scales Poorly if Many Users Are Online**
- **Problem**: Retornar 100+ usuaris de cerca pot sobrecarregar la UI o causar lag d'input.
- **Mitigation**: Limitar resultats a 10 usuaris; requerir almenys 2 caràcters en consulta de cerca.
- **Trade-off**: Els usuaris poden necessitar ser més específics amb cerques.

**[Risk] No Invitation Decline Reason or Comments**
- **Problem**: Inviter no pot saber per què invitee rebutjà.
- **Mitigation**: Rebuig és simple sí/no; si es necessita feedback, els usuaris poden seguir via xat.
- **Trade-off**: UX més simple, sense complexitat de missatgeria extra.

## Migration Plan

### Phase 1: Database
1. Afegir model `FriendInvitation` i enum `FriendInvitationStatus` a `schema.prisma`.
2. Crear migració: `npx prisma migrate dev --name add-friend-invitations`
3. Sense backfill de dades necessari (taula nova).

### Phase 2: Backend
1. Afegir mòdul `friend-invitations` amb:
   - `FriendInvitationsController` (POST /create, GET /pending, PATCH /accept, PATCH /reject)
   - `FriendInvitationsService` (CRUD, lògica d'expiració timeout)
   - DTOs per request/response
2. Afegir endpoint `/api/users/search` en un nou `UsersService` (o estendre `AuthService`)
3. Actualitzar `EventsGateway` per emetre esdeveniments `friend-invite:notify`, `friend-invite:accepted`, `friend-invite:rejected`.
4. Afegir listener Socket.IO en `App.tsx` per mostrar notificacions toast.

### Phase 3: Frontend
1. Crear component de pàgina `FriendSessionLobby` amb cerca d'usuaris + llista d'invitacions pendents.
2. Crear component `UserSearchModal` per input + resultats.
3. Crear component `PendingInvitationCard` per visualitzar invitacions rebudes.
4. Integrar amb `NotificationContext` per visualitzar notificacions en temps real.
5. Ruta: `/friend-session-lobby` (accessible només a rol CLIENT).

### Phase 4: Testing & Deployment
1. Tests backend: Specs Jest per CRUD d'invitacions, expiració timeout, prevenció duplicats.
2. QA manual: Filtratge en temps real de cerca d'usuaris, lliurament d'invitacions a través de múltiples navegadors, expiració timeout.
3. Desplegament staging i smoke test.
4. Desplegament producció via GitHub Actions.

### Rollback Strategy
- Si ocorre problema crític després de desplegament:
  1. Revertir frontend per deshabilitar ruta `/friend-session-lobby`.
  2. Backend pot romandre desplegat (sense dany si endpoints no cridats).
  3. Invitacions coach-client existents romanen sense afectar.

## Open Questions

1. **Should invitations expire for the inviter as well?**
   - Disseny actual: inviter pot mantenir el registre "invitació enviada" indefinidament (sense auto-netejar al costat inviter).
   - Alternativa: Mostrar invitacions enviades per 5 minuts, llavors auto-amagar de la UI (però mantenir en DB).
   - **Decision deferred**: Depèn de revisió UX; pot afegir-se post-MVP.

2. **Should we log who created the session (inviter vs. joinee) for analytics?**
   - Disseny actual: LiveSession no rastreja font d'invitació.
   - Alternativa: Afegir clau forana `invitationId` a LiveSession per enllaçar de tornada a la invitació.
   - **Decision deferred**: Fora d'abast per MVP; pot afegir-se si analytics esdevenen prioritat.

3. **Should clients be able to search for COACH users from the Friend Session lobby?**
   - Disseny actual: /api/users/search retorna tant COACH com CLIENT per defecte (pot filtrar-se).
   - Alternativa: Només retornar usuaris CLIENT (excloure COACHes).
   - **Decision deferred**: Depèn d'intent de producte; probablement "amics" haurien de ser només CLIENTs. A aclarir en spec.

4. **How should we handle invitations between users in different timezones or regions?**
   - Disseny actual: Sense gestió especial; visualització UI conscient de zona horària és client-side.
   - **No blocker**: Adreçat via i18n existent + locale del navegador.
