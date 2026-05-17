## Per què

El frontend no té cap infraestructura de testing automatitzat configurada avui dia; la verificació depèn exclusivament del checklist manual de `doc/Proves_usuari.md`. Configurar Vitest aprofita la integració nativa amb Vite (ja usat com a bundler) i permet a l'equip afegir tests unitaris i de component de manera eficient, seguint el mateix patró que s'ha establert per al backend (LW-448).

## Què canvia

- Afegir Vitest com a test runner per al frontend React + Vite (`src/front/`).
- Afegir un `vitest.config.ts` a `src/front/` amb configuració per a l'entorn jsdom.
- Actualitzar `devDependencies`: afegir `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
- Afegir scripts de `package.json`: `test`, `test:watch`, `test:cov` per usar la CLI de Vitest.
- Afegir un test bàsic funcional (`src/front/src/App.test.tsx` o similar) per verificar que la configuració funciona.
- Afegir un fitxer `src/front/src/test/setup.ts` per importar `@testing-library/jest-dom`.

## Capacitats

### New Capabilities

- `frontend-unit-testing`: Infraestructura i convencions per executar tests unitaris i de component al frontend React amb Vitest — configuració, scripts, setup de jsdom i un test bàsic funcional.

### Modified Capabilities

<!-- Cap canvi a nivell de spec. És un canvi de tooling/infraestructura. -->

## Impacte

- **Feature frontend afectada**: totes (canvi de tooling); cap component existent es modifica en lògica de producció en aquest canvi.
- **Dependències**: `src/front/package.json` — dev deps noves afegides.
- **Configuració Vite**: `vitest.config.ts` creat a part per no interferir amb `vite.config.ts` de producció; o bé integrat via `defineConfig` amb la clau `test`.
- **CI/CD**: `npm test` al frontend invocarà Vitest; el workflow de deploy de GitHub Actions no executa tests avui dia, però qualsevol addició futura d'un pas de test el trobarà operatiu.
- **Jira**: LW-447 — Configurar Vitest al frontend.
- **Fora d'àmbit**: afegir cobertura de tests per als components i serveis existents; és una tasca de seguiment.
- **Nota de testing**: el nou `vitest.config.ts`, el setup de jsdom i el test bàsic constitueixen el harness de verificació d'aquest canvi.
