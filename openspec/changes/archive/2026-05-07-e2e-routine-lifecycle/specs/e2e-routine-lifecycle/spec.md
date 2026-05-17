## ADDED Requirements

### Requirement: `data-testid` attributes en els components de rutines

Els components `RoutineModal` i `RoutineCard` HAURAN d'exposar atributs `data-testid` estables perquè la suite E2E pugui seleccionar elements independentment del text renderitzat o de l'idioma actiu.

Elements mínims requerits:
- `RoutineModal`: `routine-modal-name-input`, `routine-modal-save-btn`, `routine-modal-cancel-btn`, `routine-modal-name-error`
- `RoutineCard` (per a cada targeta): `routine-card-{id}`, `routine-card-edit-btn-{id}`, `routine-card-delete-btn-{id}`

#### Scenario: El modal de creació exposa els testids requerits

- **GIVEN** un coach ha iniciat sessió i navega a `/`
- **WHEN** clica el botó "Nova rutina" per obrir el `RoutineModal` en mode creació
- **THEN** `[data-testid="routine-modal-name-input"]` és visible al DOM
- **AND** `[data-testid="routine-modal-save-btn"]` és visible al DOM
- **AND** `[data-testid="routine-modal-cancel-btn"]` és visible al DOM

#### Scenario: Les targetes de rutina exposen els testids requerits

- **GIVEN** un coach ha iniciat sessió i navega a `/` amb almenys una rutina existent
- **WHEN** la pàgina carrega i renderitza la llista de rutines
- **THEN** cada targeta té `[data-testid^="routine-card-"]` al contenidor arrel
- **AND** cada targeta té `[data-testid^="routine-card-edit-btn-"]` i `[data-testid^="routine-card-delete-btn-"]`

---

### Requirement: Crear una rutina nova

Un coach PODRÀ crear una rutina nova introduint un nom al modal i confirmant-la. El sistema HAURÀ de persistir la rutina via `POST /api/routines` i mostrar-la a la llista del dashboard sense recarregar la pàgina.

#### Scenario: Creació exitosa d'una rutina

- **GIVEN** `e2e_coach` ha iniciat sessió i es troba a `/`
- **WHEN** clica "Nova rutina", omple `[data-testid="routine-modal-name-input"]` amb "Rutina E2E Nova" i clica `[data-testid="routine-modal-save-btn"]`
- **THEN** la petició `POST /api/routines` retorna HTTP 201
- **AND** la nova targeta amb el text "Rutina E2E Nova" és visible a la llista sense recarregar la pàgina
- **AND** `GET /api/routines` retorna la rutina creada al llistat del coach

#### Scenario: Creació amb rols no autoritzats retorna error de guard

- **GIVEN** un `e2e_client_linked` ha iniciat sessió
- **WHEN** envia `POST /api/routines` amb un token CLIENT vàlid
- **THEN** el backend retorna HTTP 403

#### Scenario: Testabilitat — flux de creació via Playwright

- **GIVEN** `e2e_coach` autenticat amb `loginViaApi` i `freshDb` actiu
- **WHEN** el test omple el modal via `data-testid` i espera `POST /api/routines` amb `waitForResponse`
- **THEN** el test pot verificar que `response.status() === 201` i que la targeta apareix al DOM

---

### Requirement: Editar una rutina existent

Un coach PODRÀ editar el nom d'una rutina existent. El sistema HAURÀ de persistir el canvi via `PUT /api/routines/:id/edit` i reflectir el nou nom a la targeta sense recarregar la pàgina.

#### Scenario: Edició exitosa del nom d'una rutina

- **GIVEN** `e2e_coach` ha iniciat sessió i existeix la rutina `e2e_routine_basic`
- **WHEN** clica `[data-testid="routine-card-edit-btn-{id}"]`, modifica el nom a "Rutina E2E Editada" i clica `[data-testid="routine-modal-save-btn"]`
- **THEN** la petició `PUT /api/routines/{id}/edit` retorna HTTP 200
- **AND** la targeta mostra el text "Rutina E2E Editada" sense recarregar la pàgina
- **AND** el nom anterior "e2e_routine_basic" ja no és visible a la llista

#### Scenario: Cancel·lar l'edició no persisteix cap canvi

- **GIVEN** `e2e_coach` ha iniciat sessió i existeix `e2e_routine_basic`
- **WHEN** obre el modal d'edició, canvia el nom i clica `[data-testid="routine-modal-cancel-btn"]`
- **THEN** no es fa cap petició `PUT /api/routines/:id/edit`
- **AND** la targeta segueix mostrant el nom original

---

### Requirement: Eliminar una rutina

Un coach PODRÀ eliminar una rutina. El sistema HAURÀ d'eliminar-la via `DELETE /api/routines/:id` i treure-la de la llista del dashboard sense recarregar la pàgina.

#### Scenario: Eliminació exitosa d'una rutina

- **GIVEN** `e2e_coach` ha iniciat sessió i existeix la rutina "Rutina E2E Nova"
- **WHEN** clica `[data-testid="routine-card-delete-btn-{id}"]` i confirma el diàleg natiu del navegador
- **THEN** la petició `DELETE /api/routines/{id}` retorna HTTP 200
- **AND** la targeta de "Rutina E2E Nova" desapareix de la llista sense recarregar la pàgina

#### Scenario: El diàleg de confirmació permet cancel·lar l'eliminació

- **GIVEN** `e2e_coach` ha iniciat sessió i existeix la rutina `e2e_routine_basic`
- **WHEN** clica el botó d'eliminar però descarta el diàleg natiu (cancel)
- **THEN** no es fa cap petició `DELETE /api/routines`
- **AND** la targeta de `e2e_routine_basic` segueix visible a la llista

---

### Requirement: Validació del formulari — camp nom obligatori

El `RoutineModal` HAURÀ de mostrar un missatge d'error i bloquejar l'enviament si el camp nom és buit o conté només espais en blanc.

#### Scenario: Error de validació quan el nom és buit

- **GIVEN** `e2e_coach` ha iniciat sessió i el `RoutineModal` està obert en mode creació
- **WHEN** deixa `[data-testid="routine-modal-name-input"]` buit i clica `[data-testid="routine-modal-save-btn"]`
- **THEN** `[data-testid="routine-modal-name-error"]` és visible al DOM amb un missatge d'error
- **AND** no es fa cap petició `POST /api/routines`
- **AND** el modal segueix obert

#### Scenario: Error de validació amb nom d'espais en blanc

- **GIVEN** `e2e_coach` ha iniciat sessió i el `RoutineModal` està obert en mode creació
- **WHEN** omple `[data-testid="routine-modal-name-input"]` amb "   " (espais) i clica `[data-testid="routine-modal-save-btn"]`
- **THEN** `[data-testid="routine-modal-name-error"]` és visible al DOM
- **AND** no es fa cap petició `POST /api/routines`

#### Scenario: L'error de validació desapareix quan s'introdueix un nom vàlid

- **GIVEN** el `RoutineModal` mostra l'error de nom obligatori
- **WHEN** el coach omple un nom vàlid i clica `[data-testid="routine-modal-save-btn"]`
- **THEN** `[data-testid="routine-modal-name-error"]` deixa de ser visible
- **AND** la petició `POST /api/routines` s'envia correctament
