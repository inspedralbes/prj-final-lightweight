## ADDED Requirements

### Requirement: La configuració de Vitest és present i funcional

El sistema HAURÀ DE proporcionar un fitxer `vitest.config.ts` a `src/back/` que configuri Vitest per executar tests unitaris NestJS amb transformació SWC, APIs de test globals i entorn Node.

#### Scenario: El fitxer de configuració existeix

- **QUAN** un desenvolupador obre `src/back/vitest.config.ts`
- **LLAVORS** el fitxer HAURÀ D'exportar un objecte `defineConfig` de Vitest amb `test.globals: true`, `test.environment: 'node'` i `test.include: ['src/**/*.spec.ts']` (Vitest 4 usa el transformador Oxc natiu; no cal cap plugin addicional)

#### Scenario: Els tipus TypeScript per als globals es resolen

- **QUAN** un fitxer spec usa `describe`, `it`, `expect` o `vi` sense una sentència d'importació
- **LLAVORS** el compilador TypeScript HAURÀ DE resoldre aquests globals via `tsconfig.vitest.json` (que afegeix `"types": ["vitest/globals"]`) sense errors

#### Scenario: Els metadades dels decoradors NestJS es preserven en temps d'execució

- **QUAN** Vitest executa un spec que instancia un `TestingModule` NestJS usant `@nestjs/testing`
- **LLAVORS** el transformador Oxc integrat a Vitest 4 HAURÀ D'emetre metadades de decoradors perquè la resolució de DI de NestJS tingui èxit sense errors en temps d'execució

### Requirement: Els scripts npm test invoquen Vitest

Els scripts `test`, `test:watch` i `test:cov` de `package.json` a `src/back/` HAURAN DE delegar a Vitest. L'script `test:e2e` HAURÀ DE romandre sense canvis (basat en Jest).

#### Scenario: Execució de tests unitaris

- **QUAN** un desenvolupador executa `npm test` dins `src/back/`
- **LLAVORS** la comanda HAURÀ D'executar `vitest run` i reportar pas/error per a tots els fitxers `*.spec.ts` (excloent `test/*.spec.ts` si n'hi ha)

#### Scenario: Execució de tests en mode watch

- **QUAN** un desenvolupador executa `npm run test:watch` dins `src/back/`
- **LLAVORS** la comanda HAURÀ D'executar `vitest` (mode watch interactiu) i re-executar els specs afectats en desar un fitxer

#### Scenario: Generació d'un informe de cobertura

- **QUAN** un desenvolupador executa `npm run test:cov` dins `src/back/`
- **LLAVORS** la comanda HAURÀ D'executar `vitest run --coverage` usant `@vitest/coverage-v8` i escriure un informe de cobertura HTML/text a `src/back/coverage/`

#### Scenario: L'script E2E no es veu afectat

- **QUAN** un desenvolupador executa `npm run test:e2e` dins `src/back/`
- **LLAVORS** la comanda HAURÀ DE seguir executant Jest via `./test/jest-e2e.json` sense modificació

### Requirement: El spec existent passa amb Vitest

L'`src/back/src/app.controller.spec.ts` migrat HAURÀ DE passar amb Vitest sense necessitat de reescriptures estructurals.

#### Scenario: Spec base en verd

- **QUAN** `npm test` s'executa dins `src/back/`
- **LLAVORS** el spec `AppController` HAURÀ DE reportar 1 test passat: `should return "Hello World!"`

#### Scenario: No resten imports específics de Jest

- **QUAN** s'inspecciona el fitxer spec
- **LLAVORS** NO HAURÀ D'importar de `jest` ni `@types/jest`; els globals (`describe`, `it`, `expect`, `beforeEach`) HAURAN D'estar disponibles sense import explícit

### Requirement: Jest i ts-jest s'eliminen de devDependencies

El fitxer `src/back/package.json` NO HAURÀ DE llistar `jest`, `ts-jest` ni `@types/jest` a `devDependencies`. El bloc de configuració `"jest"` HAURÀ DE ser eliminat de `package.json`.

#### Scenario: Arbre de dependències net

- **QUAN** s'executa `npm ls jest` dins `src/back/` després de la migració
- **LLAVORS** `jest` NO HAURÀ D'aparèixer com a dependència directa (pot ser una dep transitiva de paquets no relacionats, cosa acceptable)

#### Scenario: Cap configuració Jest obsoleta

- **QUAN** s'obre `package.json`
- **LLAVORS** NO HAURÀ D'haver cap clau `"jest"` de nivell superior al JSON

### Requirement: Testabilitat — verificació del harness

La configuració del harness de tests HAURÀ DE ser verificable mitjançant un procediment documentat.

#### Scenario: Execució completa de tests passa al CI

- **QUAN** `npm test` s'executa en un checkout net (després de `npm install`) dins `src/back/`
- **LLAVORS** Vitest HAURÀ DE descobrir i executar tots els fitxers `*.spec.ts` sota `src/` i sortir amb codi 0 si tots passen

#### Scenario: Procediment de verificació manual

- **QUAN** un desenvolupador segueix el pas de QA manual: `cd src/back && npm test`
- **LLAVORS** la sortida de consola HAURÀ DE mostrar `1 passed` (o més, si s'afegeixen nous specs) sense errors ni imports no resolts
