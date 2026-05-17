## Per què

Friend Session actualment requereix que els usuaris intercanviïn codis de sessió manuals, creant fricció en l'experiència de descobriment i unió. En substituir aquest flux basat en codis per un mecanisme de cerca d'usuaris que mostra només usuaris en línia, alineem les invitacions client-client amb el patró existent d'invitacions coach-client, millorant la usabilitat i animant a associacions d'entrenament més espontànies.

## Què Canvia

- Substituir el flux de compartició de codis de Friend Session amb una interfície de cerca d'usuaris
- Els clients poden cercar altres usuaris actualment connectats a la plataforma
- Els clients poden enviar invitacions d'entrenament de sessió d'amics als usuaris en línia seleccionats
- Els invitats reben notificacions en temps real amb accions d'acceptar/rebutjar
- Les invitacions acceptades uneixen automàticament ambdues parts a la mateixa sessió sense requerir entrada manual de codi
- La persistència i gestió d'estat de la sessió romanen sense canvis; només el mecanisme d'invitació/descobriment és modernitzat
- El sistema d'invitacions coach-client existent roman completament sense canvis

## Capacitats

### Noves Capacitats

- `friend-session-user-search`: Cercar usuaris en línia a la plataforma; retornar una llista filtrada d'usuaris actualment autenticats (per nom/nom d'usuari)
- `friend-session-client-invitations`: Enviar i gestionar invitacions d'entrenament de sessió d'amics entre clients; rastrejar estats d'invitació (pendent, acceptada, rebutjada, expirada)
- `friend-session-invite-notifications`: Lliurament de notificacions en temps real per invitacions de sessió d'amics utilitzant Socket.IO; integrar amb NotificationContext existent per visibilitat UI

### Capacitats Modificades

- Cap (les invitacions coach-client romanen sense canvis; el cicle de vida coop-session roman sense canvis)

## Impacte

### Mòduls Backend Afectats

- **invitations**: Estendre o crear un nou camí de servei per gestionar la lògica d'invitacions client-client separada dels fluxos coach-client
- **events** (EventsGateway): Afegir esdeveniments Socket.IO per invitacions de sessió d'amics (`friend-invite:send`, `friend-invite:accept`, `friend-invite:reject`, `friend-invite:notify`)
- **room** (unió de sessió co-op): Sense canvis; la unió de sessió per invitació acceptada passa via flux existent de unió de sala
- **prisma**: Estendre esquema si és necessari per rastrejar invitacions de sessió d'amics amb camps d'estat addicionals (però probablement reutilitza model Invitation existent amb un discriminador de tipus o nova relació)
- **auth**: Sense canvis als guards JWT/role

### Característiques Frontend Afectades

- **workout** (FriendSessionLobby o pàgina nova similar): Nova UI per cerca d'usuaris + visualització d'invitacions
- **notifications**: Integrar notificacions d'invitacions de sessió d'amics al NotificationContext existent
- **chat**: Sense canvis
- **auth**: Sense canvis

### Socket.IO & Temps Real

- Nous esdeveniments:
  - `friend-invite:send` — client envia invitació (listener: servidor, emet a `user:{invitee-id}`)
  - `friend-invite:accept` — invitant accepta (listener: servidor, emet a `user:{inviter-id}`)
  - `friend-invite:reject` — invitant rebutja (listener: servidor, emet a `user:{inviter-id}`)
  - `friend-invite:notify` — notificació servidor→client (publicat a `user:{user-id}`)
  - Rastreig de presència en línia d'usuaris (aprofitar llista de clients Socket.IO existent; pot necessitar esdeveniments `user:online` i `user:offline` si no ja presents)

### Esquema de Base de Dades

- Extensió del model **Invitation** o nou model `FriendInvitation`:
  - Enum d'estat: PENDING, ACCEPTED, REJECTED, EXPIRED
  - Timestamps: createdAt, expiresAt (e.g., 5 minuts des d'ara per timeout)
  - Relacions: inviterId, inviteeId (ambdós User)
  - Possiblement un camp `type` (COACH_TO_CLIENT vs FRIEND_SESSION) o taula separada

### Testing & QA

- Verificació manual: cercar usuari en línia, enviar invitació, rebre notificació al costat de l'invitant, flux acceptar/rebutjar
- Seqüenciació d'esdeveniments Socket.IO: verificar lògica de timeout (després de 5 min, invitació auto-expira)
- Sense invitacions duplicades: mateixa parella inviter-invitee en una finestra de temps donada
- Usuaris offline: els resultats de cerca no inclouen usuaris actualment desconnectats

### No-Objectius

- Integració de videotrucada amb sessions d'amics (fora d'abast per aquest canvi)
- Afegir relacions d'amics o persistència de gràfic social
- Modificar UX d'invitacions coach-client existent o flux
- Implementar llistes d'amics o gestió de contactes
