## 1. Frontend — afegir `data-testid` als components de rutines

- [x] 1.1 Afegir `data-testid="routine-modal-name-input"` a l'`<input>` del nom a `src/front/src/features/routines/components/RoutineModal.tsx`
- [x] 1.2 Afegir `data-testid="routine-modal-save-btn"` al botó de guardar/crear de `RoutineModal.tsx`
- [x] 1.3 Afegir `data-testid="routine-modal-cancel-btn"` al botó de cancel·lar de `RoutineModal.tsx`
- [x] 1.4 Afegir `data-testid="routine-modal-name-error"` al bloc d'error del nom de `RoutineModal.tsx`
- [x] 1.5 Afegir `data-testid={`routine-card-${routine.id}`}` al contenidor arrel de `src/front/src/features/routines/components/RoutineCard.tsx`
- [x] 1.6 Afegir `data-testid={`routine-card-edit-btn-${routine.id}`}` al botó d'editar de `RoutineCard.tsx`
- [x] 1.7 Afegir `data-testid={`routine-card-delete-btn-${routine.id}`}` al botó d'eliminar de `RoutineCard.tsx`

## 2. E2E — escriure la suite de tests

- [x] 2.1 Crear `e2e/tests/routines.spec.ts` amb `test.describe.configure({ mode: 'serial' })` i la funció helper `setLangCa`
- [x] 2.2 Implementar el test "crear una rutina nova" — obre el modal, omple el nom, guarda i verifica HTTP 201 + targeta visible
- [x] 2.3 Implementar el test "editar una rutina existent" — clica edit a `e2e_routine_basic`, canvia el nom, guarda i verifica HTTP 200 + nou nom visible
- [x] 2.4 Implementar el test "cancel·lar l'edició no persisteix canvis" — obre modal d'edició, canvia nom, cancel·la i verifica que no s'ha fet PATCH
- [x] 2.5 Implementar el test "eliminar una rutina" — clica delete, accepta el diàleg nadiu (`page.on('dialog')`) i verifica HTTP 200 + targeta desapareguda
- [x] 2.6 Implementar el test "validació — nom buit mostra error i no fa POST" — envia el formulari buit i verifica `routine-modal-name-error` visible
- [x] 2.7 Implementar el test "validació — nom amb espais en blanc mostra error" — envia el formulari amb " " i verifica el mateixa error

## 3. Verificació i qualitat

- [x] 3.1 Executar `cd e2e && npx playwright test routines.spec.ts --headed` localment contra Docker Compose i confirmar que tots els tests passen
- [x] 3.2 Executar `cd src/front && npm run lint && npm run build` i verificar que la build passa sense errors després dels canvis als components
- [x] 3.3 Revisar que els `data-testid` afegits no trenquen cap dels tests E2E existents (`invitations.spec.ts`, `smoke.spec.ts`, `seed.spec.ts`)
