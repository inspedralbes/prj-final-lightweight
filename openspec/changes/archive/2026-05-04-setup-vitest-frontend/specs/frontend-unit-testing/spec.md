## ADDED Requirements

### Requirement: La configuració de Vitest és present i funcional

El sistema HAURÀ DE proporcionar una configuració Vitest a `src/front/vite.config.ts` (clau `test`) que configuri Vitest per executar tests de components React amb entorn jsdom, globals activats i el setup file de `@testing-library/jest-dom`.

#### Scenario: La configuració de Vitest existeix

- **QUAN** un desenvolupador obre `src/front/vite.config.ts`
- **LLAVORS** el fitxer HAURÀ D'importar `defineConfig` de `vitest/config` i exportar un objecte amb `test.globals: true`, `test.environment: 'jsdom'` i `test.setupFiles: ['./src/test/setup.ts']`

#### Scenario: El path alias @/ funciona en tests

- **QUAN** un fitxer de test importa un mòdul usant `@/` (ex. `import { api } from '@/shared/utils/api'`)
- **LLAVORS** Vitest HAURÀ DE resoldre l'alias correctament a `src/front/src/` sense errors de resolució de mòdul

#### Scenario: Els tipus TypeScript per als globals es resolen

- **QUAN** un fitxer test usa `describe`, `it`, `expect` o `vi` sense una sentència d'importació
- **LLAVORS** el compilador TypeScript HAURÀ DE resoldre aquests globals via `"types": ["vitest/globals"]` a `tsconfig.app.json` (o fitxer equivalent) sense errors

#### Scenario: Les matchers de jest-dom estan disponibles

- **QUAN** un test utilitza matchers com `toBeInTheDocument()`, `toHaveClass()` o `toHaveTextContent()`
- **LLAVORS** Vitest HAURÀ DE reconèixer les matchers exteses per `@testing-library/jest-dom` importat a `src/front/src/test/setup.ts`

### Requirement: Els scripts npm test invoquen Vitest

Els scripts `test`, `test:watch` i `test:cov` de `package.json` a `src/front/` HAURAN DE delegar a Vitest.

#### Scenario: Execució de tests unitaris

- **QUAN** un desenvolupador executa `npm test` dins `src/front/`
- **LLAVORS** la comanda HAURÀ D'executar `vitest run` i reportar pas/error per a tots els fitxers `*.test.tsx` i `*.test.ts`

#### Scenario: Execució de tests en mode watch

- **QUAN** un desenvolupador executa `npm run test:watch` dins `src/front/`
- **LLAVORS** la comanda HAURÀ D'executar `vitest` (mode watch interactiu) i re-executar els tests afectats en desar un fitxer

#### Scenario: Generació d'un informe de cobertura

- **QUAN** un desenvolupador executa `npm run test:cov` dins `src/front/`
- **LLAVORS** la comanda HAURÀ D'executar `vitest run --coverage` usant `@vitest/coverage-v8` i escriure un informe de cobertura a `src/front/coverage/`

### Requirement: Un test bàsic de component passa

El sistema HAURÀ DE proporcionar almenys un test funcional que validi que el harness de React Testing Library opera correctament.

#### Scenario: Test bàsic en verd

- **QUAN** `npm test` s'executa dins `src/front/`
- **LLAVORS** el test bàsic HAURÀ DE reportar almenys 1 test passat que renderitzi un component React i asserti la seva presència al DOM

#### Scenario: El test usa React Testing Library

- **QUAN** s'inspecciona el fitxer de test bàsic
- **LLAVORS** HAURÀ D'usar `render` de `@testing-library/react` i almenys una matcher de `@testing-library/jest-dom`

### Requirement: Les dev dependencies de Vitest estan instal·lades

El fitxer `src/front/package.json` HAURÀ DE llistar `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` i `jsdom` a `devDependencies`.

#### Scenario: Instal·lació neta de dependències

- **QUAN** s'executa `npm install` dins `src/front/` en un directori buit
- **LLAVORS** totes les dependencies de Vitest HAURAN DE ser instal·lades sense errors de resolució de versions

#### Scenario: Cap conflicte amb Vite de producció

- **QUAN** s'executa `npm run build` dins `src/front/` després d'instal·lar les noves dev deps
- **LLAVORS** la build de producció HAURÀ DE completar-se sense errors (`tsc -b && vite build` ha de passar)

### Requirement: Testabilitat — verificació del harness

La configuració del harness de tests HAURÀ DE ser verificable mitjançant un procediment documentat.

#### Scenario: Execució completa de tests passa en un checkout net

- **QUAN** `npm install && npm test` s'executa en un checkout net dins `src/front/`
- **LLAVORS** tots els tests HAURAN DE passar en verd sense necessitat de configuració addicional

#### Scenario: Verificació manual del harness

- **QUAN** un QA segueix els passos: clonar el repo, `cd src/front`, `npm install`, `npm test`
- **LLAVORS** la sortida de la consola HAURÀ DE mostrar "X tests passed" sense errors
