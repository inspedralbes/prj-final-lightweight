## Per què

El frontend de LightWeight no disposa de cap test automatitzat. Qualsevol regressió en components React, serveis o lògica de negoci es detecta manualment, la qual cosa ralenteix el cicle de qualitat i introdueix risc a cada desplegament. Configurar Vitest i escriure els primers tests unitaris estableix el harness mínim perquè l'equip pugui créixer la cobertura de forma incremental.

Jira US: **LW-451** — Implementar tests unitaris inicials del frontend amb Vitest

## Què Canvia

- Instal·lar `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` i `jsdom` com a `devDependencies` a `src/front/package.json`.
- Ampliar `src/front/vite.config.ts` amb el bloc `test` de Vitest (entorn `jsdom`, globals activats, setup file).
- Crear `src/front/src/test/setup.ts` que importi `@testing-library/jest-dom`.
- Afegir `"types": ["vitest/globals"]` a `tsconfig.app.json` del frontend.
- Afegir scripts `test`, `test:watch` i `test:cov` a `src/front/package.json`.
- Escriure una suite inicial de tests unitaris per als components i serveis més crítics:
  - Components compartits (`LoadingScreen`, `ConfirmModal`, `ToastProvider`)
  - Context d'autenticació (`AuthContext`)
  - Utilitat HTTP (`api.ts` — interceptors del token i gestió del 401)
- Documentar el procediment de verificació manual al fitxer de proves.

## Capacitats

### Noves Capacitats

- `frontend-unit-testing`: Configuració completa del harness de Vitest per al frontend React, amb tests inicials que validen els components i serveis fonamentals.

### Capacitats Modificades

_(Cap requisit de spec existent canvia.)_

## Impacte

**Frontend (`src/front/`):**

- `vite.config.ts` — afegir configuració `test`
- `tsconfig.app.json` — afegir `vitest/globals` als types
- `package.json` — noves `devDependencies` i scripts npm
- `src/test/setup.ts` — nou fitxer de setup del harness
- `src/features/**/__tests__/` o `*.test.tsx` — nous fitxers de test

**Backend:** no afectat.

**Infraestructura / CI:**

- El pipeline de GitHub Actions podrà executar `npm test` al frontend com a nou gate de qualitat (fora de l'abast d'aquest canvi, però la porta queda oberta).

**Testing:**

- La configuració del harness és en si mateixa el lliurable. Els tests inicials demostren que el harness funciona i serveixen de model per a futures suites.
- Cap nova ruta ni event de Socket.IO implicat.

**No-goals:**

- No s'inclouen tests d'integració ni E2E (cobertura del Playwright ja gestionada per la spec `e2e-testing`).
- No es configura la integració de cobertura en el pipeline de CI en aquest canvi.
- No s'escriuen tests per al backend en aquest canvi (gestionat per `backend-unit-testing`).
