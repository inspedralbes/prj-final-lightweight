# Spec Delta: Tests E2E — Extensió d'invitacions

## Propòsit

Spec delta per a la capacitat `e2e-testing` existent. Afegeix el requisit de l'atribut `data-testid` per al badge d'invitacions pendents a `Layout.tsx`, necessari per a la consulta fiable amb Playwright a la suite de tests d'invitacions.

---

## ADDED Requirements

### Requirement: El badge d'invitacions pendents exposa data-testid per a la selecció E2E

El component Layout HA DE renderitzar l'element del badge d'invitacions pendents amb `data-testid="pending-invites-badge"` sempre que el comptador del badge sigui superior a zero, perquè els tests Playwright el puguin localitzar de forma fiable sense dependre de selectors CSS fràgils o de text.

#### Scenario: L'element del badge és consultable per data-testid quan el comptador és > 0

- **GIVEN** el frontend s'està executant i `e2e_client_unlinked` ha iniciat sessió
- **AND** hi ha almenys una invitació `PENDING` per a aquest client
- **WHEN** Playwright consulta `page.locator('[data-testid="pending-invites-badge"]')`
- **THEN** es troba exactament un element
- **AND** el seu `textContent` és igual a la representació en cadena del comptador de pendents (p. ex. `"1"`)

#### Scenario: L'element del badge és absent quan el comptador és 0

- **GIVEN** `e2e_client_linked` ha iniciat sessió (ja té un coach, cap invitació pendent)
- **WHEN** Playwright consulta `page.locator('[data-testid="pending-invites-badge"]')`
- **THEN** el comptador d'elements és 0 (element no al DOM o ocult)

#### Scenario: Testabilitat — l'atribut és present al HTML renderitzat

- **GIVEN** la compilació del frontend finalitza correctament (`npm run build` a `src/front/`)
- **WHEN** un desenvolupador inspecciona el nav de Layout a DevTools amb una invitació pendent present
- **THEN** el `<span>` del badge (o element equivalent) té `data-testid="pending-invites-badge"` als seus atributs
