## Per què

El backend utilitza actualment Jest (per defecte de NestJS) amb `ts-jest`, però la cobertura és mínima (només l'`app.controller.spec.ts` generat automàticament). Configurar Vitest substitueix Jest per un test runner més ràpid i natiu a ESM, amb suport de primera classe per a TypeScript sense la sobrecàrrega de transformació de `ts-jest`, cosa que permet a l'equip afegir tests unitaris de manera eficient a mesura que el codi creix.

## Què canvia

- Substituir Jest + `ts-jest` per Vitest com a test runner per al backend NestJS (`src/back/`).
- Eliminar la configuració de Jest de `package.json`; afegir un `vitest.config.ts` a `src/back/`.
- Actualitzar `devDependencies`: eliminar `jest`, `ts-jest`, `@types/jest`; afegir `vitest`, `@vitest/coverage-v8`.
- Actualitzar els scripts de `package.json`: `test`, `test:watch`, `test:cov` per usar la CLI de Vitest.
- Migrar l'`app.controller.spec.ts` existent per usar imports de Vitest (`describe`, `it`, `expect`, `beforeEach` de `vitest`).
- Mantenir `test:e2e` separat (usa `test/jest-e2e.json` i Supertest — no es migra en aquest canvi).

## Capacitats

### Noves capacitats

- `backend-unit-testing`: Infraestructura i convencions per executar tests unitaris al backend NestJS amb Vitest — configuració, scripts i un spec bàsic funcional.

### Capacitats modificades

<!-- Cap canvi a nivell de spec. És un canvi de tooling/infraestructura. -->

## Impacte

- **Mòdul backend afectat**: tots (canvi de tooling); només `src/back/src/app.controller.spec.ts` es toca a nivell de codi en aquest canvi.
- **Dependències**: `src/back/package.json` — dev deps actualitzades, bloc de configuració de Jest eliminat.
- **CI/CD**: `npm test` al backend invocarà Vitest en lloc de Jest; el workflow de deploy de GitHub Actions no executa tests avui dia, però qualsevol addició futura d'un pas de test usarà Vitest automàticament.
- **Jira**: LW-448 — Configurar Vitest al backend.
- **Fora d'àmbit**: migrar tests e2e (`test:e2e`) o afegir cobertura de tests unitaris per als serveis existents; són tasques de seguiment.
- **Nota de testing**: el nou `vitest.config.ts` i el spec bàsic constitueixen el harness de verificació d'aquest canvi.
