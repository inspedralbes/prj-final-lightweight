## Context

El frontend de LightWeight ja disposa d'una configuració parcial de Vitest:

- `vite.config.ts` ja importa `defineConfig` de `vitest/config` i inclou el bloc `test` (globals, jsdom, setupFiles).
- `tsconfig.app.json` ja té `"vitest/globals"` als `types`.
- `src/front/src/test/setup.ts` ja importa `@testing-library/jest-dom`.
- `src/front/package.json` ja inclou totes les `devDependencies` necessàries i els scripts `test`, `test:watch` i `test:cov`.
- Existeix un únic test bàsic (`src/test/basic.test.tsx`) que valida el render mínim.

El que manca és la suite de tests unitaris inicials que cobreixi els components i serveis fonamentals de l'aplicació.

**Restriccions:**

- TypeScript `verbatimModuleSyntax: true` → tots els imports de tipus han d'usar `import type`.
- Path alias `@/` → `src/front/src/`. Cal que la resolució funcioni en tests.
- Cap component pot importar entre features directament; els mocks han de respectar la mateixa arquitectura.
- No hi ha backend actiu durant els tests — tots els serveis HTTP han de ser mockejats.

## Goals / Non-Goals

**Goals:**

- Escriure tests unitaris per als components compartits d'ús transversal: `ConfirmModal`, `LoadingScreen`.
- Escriure tests unitaris per a la utilitat HTTP `api.ts` (interceptor del token i gestió del 401).
- Escriure tests unitaris per al context `AuthContext`.
- Garantir que `npm test` passa en verd sense cap configuració addicional.
- Establir patrons de test reutilitzables (mocking de `localStorage`, `axios`, `react-router`) que l'equip pugui seguir.

**Non-Goals:**

- Tests d'integració o E2E (cobertos per `e2e-testing`).
- Tests del backend (cobertos per `backend-unit-testing`).
- Tests de l'hook `useToast` (diferit a un canvi futur; requereix un setup addicional del context de notificacions).
- Cobertura del 100%; l'objectiu és el harness + tests representatius.
- Integració de la cobertura al pipeline CI (fora d'abast d'aquest canvi).
- Tests de components que depenen de Socket.IO en temps real (massa cost de setup, diferit).

## Decisions

### D1 — Ubicació dels fitxers de test

Els tests viuen a `__tests__/` dins el mateix directori que el fitxer que testen, seguint la convenció de proximitat:

```
src/shared/components/__tests__/ConfirmModal.test.tsx
src/shared/components/__tests__/LoadingScreen.test.tsx
src/shared/utils/__tests__/api.test.ts
src/shared/hooks/__tests__/useToast.test.tsx
src/features/auth/context/__tests__/AuthContext.test.tsx
```

**Alternativa descartada:** directori centralitzat `src/test/` — dificulta trobar el test associat a un fitxer concret.

### D2 — Mocking d'axios

S'usa `vi.mock('axios')` amb `vi.fn()` per als mètodes `create`, `interceptors.request.use` i `interceptors.response.use`. No s'usa cap llibreria de mock HTTP addicional (ex. `msw`) per mantenir les dependències mínimes en aquesta primera iteració.

### D3 — Mocking de localStorage

Durant la implementació es va descobrir que jsdom no inicialitza `localStorage` amb mètodes funcionals (`setItem`, `getItem`, `clear`, etc.) quan l'entorn no té un origen vàlid (URL per defecte `about:blank`). Per això, la decisió inicial d'usar `vi.spyOn(window.localStorage, 'getItem')` va resultar inviable.

**Solució adoptada:** S'ha afegit un mock global de `localStorage` al fitxer `src/test/setup.ts` (execució prèvia a tots els tests). A més, `api.test.ts` usa `vi.stubGlobal("localStorage", makeLocalStorageMock())` per disposar d'un store completament aïllat per test, evitant interferències entre casos de prova.

### D4 — Mocking de react-router

Per als components que usen `useNavigate` o `<Link>`, es wrapa el component en `<MemoryRouter>` de `react-router-dom` en el render del test.

### D5 — AuthContext en tests

Es crea un `renderWithAuthContext(ui, { user, logout })` helper a `src/test/test-utils.tsx` per proporcionar el context als components que el necessiten.

## Risks / Trade-offs

| Risc                                                                       | Probabilitat | Impacte | Mitigació                                                                      |
| -------------------------------------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------ |
| L'interceptor 401 crida `window.location.href` que jsdom no gestiona igual | Mitjana      | Baix    | Mockejar `window.location` amb `vi.stubGlobal`                                 |
| Components amb animacions CSS fallen a jsdom per manca de suport           | Baixa        | Baix    | Ignorar assercions d'estil animat; testejar presència al DOM                   |
| Canvis futurs als components trenquen els tests existents                  | Baixa        | Mitjà   | Tests al comportament visible (text, roles ARIA), no a detalls d'implementació |
