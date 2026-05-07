# Spec: E2E Invitacions i Notificacions

## Propòsit

Suite de tests end-to-end amb Playwright que cobreix el flux complet d'invitació coach-client i el lliurament de la notificació en temps real associada. Els tests s'executen contra el harness E2E existent (workspace, fixtures, `TestingModule`, seed data) i utilitzen dos contextos de navegador independents per simular la interacció bidireccional.

---

## Requirements

### Requirement: El coach envia una invitació i el client rep la notificació en temps real

El sistema HA D'emetre, quan un coach genera un codi d'invitació via la interfície i el client destinatari està connectat, un event Socket.IO `coach-invitation` a la sala `user:{clientId}` del client perquè el badge d'invitacions pendents del client s'incrementi sense recarregar la pàgina.

#### Scenario: El coach genera un codi d'invitació via la interfície

- **GIVEN** `e2e_coach` ha iniciat sessió i navega a la pàgina d'invitació (`/coach/invite`)
- **WHEN** el coach clica el botó "Genera codi d'invitació"
- **THEN** la pàgina mostra una cadena de codi d'invitació (no buida)
- **AND** la resposta HTTP de `POST /api/invitations` retorna HTTP 201

#### Scenario: El badge del client s'incrementa després de rebre l'event coach-invitation

- **GIVEN** `e2e_client_unlinked` ha iniciat sessió (no té coach) i el nav de Layout està renderitzat
- **AND** `e2e_coach` està connectat i envia una invitació dirigida a `e2e_client_unlinked`
- **WHEN** el servidor emet `coach-invitation` a `user:{e2e_client_unlinked.id}`
- **THEN** el badge d'invitacions pendents del client mostra un comptador ≥ 1 sense que el client hagi recarregat la pàgina
- **AND** `GET /api/invitations/pending-for-me` retorna almenys una invitació amb `status: "PENDING"`

#### Scenario: El client fora de línia no rep l'event però la invitació es persisteix

- **GIVEN** `e2e_client_unlinked` NO està connectat a Socket.IO
- **WHEN** `e2e_coach` envia una invitació dirigida a `e2e_client_unlinked`
- **THEN** el backend registra un avís que el client està fora de línia
- **AND** la fila d'invitació existeix a la BD amb `status: "PENDING"`
- **AND** quan el client carregui `/clients/my-coach` més tard, la invitació apareix a la llista de pendents (fetch REST)

#### Scenario: Testabilitat — flux complet d'enviament i notificació via patró de dos contextos Playwright

- **GIVEN** tant `e2e_coach` (context A) com `e2e_client_unlinked` (context B) han iniciat sessió via `POST /api/testing/login` i totes dues pàgines estan obertes
- **WHEN** el context A navega a `/coach/invite` i clica "Genera codi d'invitació"
- **THEN** el badge d'invitacions pendents del context B es fa visible amb un comptador ≥ 1 dins del timeout per defecte de Playwright (30 s)

---

### Requirement: El client accepta una invitació pendent

El sistema HA DE, quan un client amb una invitació `PENDING` crida `POST /api/invitations/:code/accept`, marcar la invitació com a `ACCEPTED`, vincular el client al coach (`clientProfile.coachId`) i reflectir el nou estat tant a la interfície del client com a la llista de clients del coach.

#### Scenario: El client accepta la invitació via la interfície

- **GIVEN** `e2e_client_unlinked` és a la pàgina `/clients/invitations`
- **AND** hi ha una invitació `PENDING` de `e2e_coach` llistada
- **WHEN** el client clica el botó "Acceptar" sobre aquella invitació
- **THEN** la fila de la invitació desapareix de la llista de pendents
- **AND** el badge d'invitacions pendents desapareix
- **AND** `GET /api/invitations/pending-for-me` retorna un array buit

#### Scenario: La invitació acceptada es reflecteix a la llista de clients del coach

- **GIVEN** `e2e_client_unlinked` acaba d'acceptar la invitació
- **WHEN** `e2e_coach` navega a `/clients`
- **THEN** el nom d'usuari de `e2e_client_unlinked` apareix a la llista de clients
- **AND** el coach pot veure l'entrada de perfil del client

#### Scenario: El doble acceptament de la mateixa invitació és rebutjat

- **GIVEN** `e2e_client_unlinked` ja ha acceptat la invitació `E2E-INVITE-001`
- **WHEN** es fa un segon `POST /api/invitations/E2E-INVITE-001/accept`
- **THEN** el backend retorna HTTP 409 CONFLICT
- **AND** no es crea cap fila `ClientProfile` duplicada

#### Scenario: Testabilitat — flux d'acceptació via Playwright

- **GIVEN** `freshDb` ha executat i el seed proporciona `E2E-INVITE-001` en estat `PENDING`
- **WHEN** `e2e_client_unlinked` inicia sessió, navega a `/clients/invitations` i clica Acceptar
- **THEN** `POST /api/invitations/E2E-INVITE-001/accept` retorna HTTP 200
- **AND** la pàgina del client ja no mostra aquella invitació

---

### Requirement: El client rebutja una invitació pendent

El sistema HA DE, quan un client amb una invitació `PENDING` crida `PATCH /api/invitations/:id/reject`, marcar la invitació com a `REJECTED` i eliminar-la de la llista de pendents del client sense vincular el client al coach.

#### Scenario: El client rebutja la invitació via la interfície

- **GIVEN** `e2e_client_unlinked` és a la pàgina `/clients/invitations`
- **AND** hi ha una invitació `PENDING` de `e2e_coach` llistada
- **WHEN** el client clica el botó "Rebutjar" sobre aquella invitació
- **THEN** la fila de la invitació desapareix de la llista de pendents
- **AND** el badge d'invitacions pendents desapareix
- **AND** la pàgina NO mostra els detalls del coach (el client roman desvinculat)

#### Scenario: La invitació rebutjada deixa el client desvinculat

- **GIVEN** `e2e_client_unlinked` ha rebutjat la invitació
- **WHEN** es crida `GET /api/invitations/pending-for-me`
- **THEN** la resposta és un array buit
- **AND** el `coachId` del client a localStorage roman `null`

#### Scenario: La invitació rebutjada no apareix a la llista de clients del coach

- **GIVEN** `e2e_client_unlinked` ha rebutjat la invitació de `e2e_coach`
- **WHEN** `e2e_coach` navega a `/clients`
- **THEN** `e2e_client_unlinked` NO apareix a la llista de clients

#### Scenario: Testabilitat — flux de rebuig via Playwright

- **GIVEN** `freshDb` ha executat i el seed proporciona `E2E-INVITE-001` en estat `PENDING`
- **WHEN** `e2e_client_unlinked` inicia sessió, navega a `/clients/invitations` i clica Rebutjar
- **THEN** `PATCH /api/invitations/:id/reject` retorna HTTP 200
- **AND** la pàgina del client ja no mostra aquella invitació

---

### Requirement: El badge d'invitacions pendents reflecteix l'estat en temps real

El sistema HA DE mostrar un badge numèric a l'element de navegació "El meu coach" del client que indiqui el nombre d'invitacions `PENDING`. El badge HA D'incrementar-se immediatament en rebre l'event Socket.IO `coach-invitation` i HA DE disminuir (o desaparèixer) després d'una acció d'acceptació o rebuig sense necessitar una recàrrega de pàgina.

#### Scenario: El badge mostra 0 quan no hi ha invitacions pendents

- **GIVEN** `e2e_client_linked` (que ja té un coach) ha iniciat sessió
- **WHEN** el nav de Layout es renderitza
- **THEN** cap badge d'invitacions pendents és visible a l'element de nav "El meu coach" (comptador és 0 o l'element és absent)

#### Scenario: El badge s'incrementa amb l'event coach-invitation entrant

- **GIVEN** `e2e_client_unlinked` ha iniciat sessió amb el badge a 0
- **WHEN** arriba l'event socket `coach-invitation`
- **THEN** el comptador del badge es converteix en 1 sense recàrrega de pàgina

#### Scenario: El badge s'actualitza després d'una acció d'acceptació o rebuig

- **GIVEN** el badge mostra comptador 1 (una invitació pendent)
- **WHEN** el client accepta o rebutja la invitació
- **THEN** el badge desapareix o mostra 0
- **AND** `GET /api/invitations/pending-for-me` confirma zero invitacions pendents

#### Scenario: Testabilitat — l'element del badge té l'atribut data-testid

- **GIVEN** el component Layout es renderitza amb almenys una invitació pendent
- **WHEN** Playwright consulta `[data-testid="pending-invites-badge"]`
- **THEN** l'element existeix i el seu contingut de text és igual al comptador de pendents com a cadena

---

### Requirement: Aplicació del control d'accés basat en rol als endpoints d'invitació

El sistema HA D'aplicar guards de rol a tots els endpoints REST d'invitació perquè les peticions no autoritzades siguin rebutjades amb l'estat HTTP correcte.

#### Scenario: La petició no autenticada per generar una invitació és rebutjada

- **GIVEN** cap JWT a les capçaleres de la petició
- **WHEN** es crida `POST /api/invitations`
- **THEN** es retorna HTTP 401

#### Scenario: El client no pot generar un codi d'invitació

- **GIVEN** una petició autenticada com a `UserRole.CLIENT`
- **WHEN** es crida `POST /api/invitations`
- **THEN** es retorna HTTP 403

#### Scenario: El coach no pot acceptar una invitació

- **GIVEN** una petició autenticada com a `UserRole.COACH`
- **WHEN** es crida `POST /api/invitations/:code/accept`
- **THEN** es retorna HTTP 403

#### Scenario: El coach no pot rebutjar una invitació

- **GIVEN** una petició autenticada com a `UserRole.COACH`
- **WHEN** es crida `PATCH /api/invitations/:id/reject`
- **THEN** es retorna HTTP 403
