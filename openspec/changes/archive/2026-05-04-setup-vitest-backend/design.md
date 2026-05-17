## Context

El backend NestJS (`src/back/`) s'instal·la amb Jest + `ts-jest` tal com configura `@nestjs/cli`. Avui hi ha un únic fitxer spec: `src/back/src/app.controller.spec.ts` (scaffold generat automàticament). Les comandes de test (`npm test`, `npm run test:cov`) deleguen a Jest via el bloc de configuració `"jest"` dins `package.json`.

NestJS depèn de decoradors TypeScript (`@Injectable`, `@Controller`, etc.) amb `emitDecoratorMetadata: true`. Això requereix que qualsevol transformador de tests entengui els decoradors legacy, cosa que `ts-jest` gestiona avui però amb una penalitat notable d'arrancada.

## Objectius / Fora d'àmbit

**Objectius:**

- Substituir Jest + `ts-jest` per Vitest com a test runner unitari per a `src/back/`.
- Proporcionar un `vitest.config.ts` funcional a `src/back/` que gestioni correctament els decoradors NestJS.
- Mantenir els scripts `npm test` / `npm run test:cov` / `npm run test:watch` funcionant, ara amb Vitest.
- Migrar l'`app.controller.spec.ts` existent als imports de Vitest.
- Establir `@vitest/coverage-v8` com a backend de cobertura.

**Fora d'àmbit:**

- Migrar `test:e2e` (es manté en Jest via `test/jest-e2e.json` + Supertest; àmbit no relacionat).
- Afegir cobertura de tests més enllà de l'`app.controller.spec.ts` migrat.
- Canviar la configuració de tests del frontend (tampoc hi ha Vitest configurat avui).

## Decisions

### Decisió 1 — Vitest en lloc de Jest

| Criteri                 | Jest + ts-jest                                                | Vitest + unplugin-swc                                               |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Temps d'arrancada       | Lent (ts-jest transpila a cada execució)                      | Ràpid (transformació SWC, sense pas de transpilació separat)        |
| Configuració TypeScript | Requereix preset `ts-jest` + config de transformació separada | TS natiu via SWC — llegeix `tsconfig.json`                          |
| Compatibilitat d'API    | Referència                                                    | Superset compatible (`describe/it/expect`) — diferències mínimes    |
| Suport de decoradors    | Via `ts-jest` + `tsconfig.json` `emitDecoratorMetadata`       | Via `@swc/core` amb `emitDecoratorMetadata: true` a la config SWC   |
| Cobertura               | `jest --coverage` (Istanbul)                                  | `@vitest/coverage-v8` (V8 integrat, sense transformació addicional) |

**Decisió**: adoptar Vitest. L'API compatible amb Jest significa que el spec existent i els futurs no requereixen canvis estructurals. El plugin `unplugin-swc` resol el requisit de decoradors NestJS de manera neta.

### Decisió 2 — Oxc natiu de Vitest 4 com a transformador

Vitest 4 va canviar el seu pipeline intern d'esbuild a **Oxc**, el qual suporta decoradors TypeScript legacy (`emitDecoratorMetadata`) de manera nativa sense necessitat de cap plugin addicional. Opcions considerades:

- **Oxc natiu (Vitest 4)** ✅ escollit: config `defineConfig` sense plugins — Oxc gestiona decoradors NestJS correctament.
- **`unplugin-swc` + `@swc/core`**: inicialment considerat, però incompatible amb Vitest 4. El plugin SWC reescriu els mòduls CommonJS de manera que conflictua amb la resolució de mòduls d'Oxc, causant errors `Cannot find module`. No instal·lat.
- **`@swc-node/register` + pool override**: més invasiu; requereix patchejar el loader de Node.

> **Nota d'implementació**: Quan el canvi es va aplicar originalment, el `design.md` especificava `unplugin-swc`. Durant la implementació es va descobrir la incompatibilitat i es va adoptar la config Oxc nativa, que és el comportament recomanat per a Vitest 4.

### Decisió 3 — Mode globals activat

Vitest `globals: true` fa que `describe / it / expect / beforeEach / vi` estiguin disponibles sense imports explícits, coincidint amb el comportament de Jest al spec existent. Per satisfer TypeScript, cal afegir `"types": ["vitest/globals"]` al tsconfig de tests.

### Decisió 4 — `tsconfig.vitest.json` separat

El `tsconfig.json` principal apunta a sortida CommonJS (`"module": "commonjs"`). El pipeline Vitest/Vite és ESM-first a nivell de bundler però executa specs en Node (compatible amb CommonJS via SWC). Un `tsconfig.vitest.json` lleuger estén el principal i afegeix `"types": ["vitest/globals"]` sense tocar la configuració de build.

### Decisió 5 — El test runner E2E es manté en Jest

`test/jest-e2e.json` referencia Jest directament; migrar-lo és ortogonal i no aporta benefici per a aquest canvi. L'script `test:e2e` es deixa sense canvis.

## Riscos / Compromisos

| Risc                                                                                                                     | Mitigació                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El suport de decoradors SWC divergeix de `tsc` en casos límit                                                            | El spec scaffold existent és simple; qualsevol divergència de decoradors apareix immediatament. Els specs futurs amb DI complex s'han de validar amb `nest build` al CI. |
| Els números de cobertura de `@vitest/coverage-v8` difereixen d'Istanbul                                                  | Acceptable: la cobertura no s'enforçava abans. L'equip ha de tractar la sortida V8 com la nova línia base.                                                               |
| Futurs `nest generate` poden tornar a emetre indicacions de configuració Jest                                            | Els fitxers generats continuaran funcionant; els desenvolupadors simplement executen `npm test` que invoca Vitest.                                                       |
| `globals: true` pot filtrar globals de test a fitxers no-test si la inferència de tipus de l'IDE no està ben configurada | S'adreça limitant `"types": ["vitest/globals"]` únicament a `tsconfig.vitest.json`, no al tsconfig principal.                                                            |

## Pla de migració

1. **Instal·lar noves dev dependencies** dins `src/back/`:

   ```
   npm install --save-dev vitest @vitest/coverage-v8
   ```

2. **Eliminar les velles deps de test** de `package.json`:

   ```
   npm uninstall jest ts-jest @types/jest
   ```

3. **Eliminar el bloc de configuració `"jest"`** de `src/back/package.json`.

4. **Actualitzar `scripts`** a `package.json`:

   ```json
   "test":        "vitest run",
   "test:watch":  "vitest",
   "test:cov":    "vitest run --coverage"
   ```

5. **Crear `src/back/vitest.config.ts`**:

   ```ts
   import { defineConfig } from "vitest/config";

   export default defineConfig({
     test: {
       globals: true,
       root: "./",
       environment: "node",
       include: ["src/**/*.spec.ts"],
     },
   });
   ```

   > Vitest 4 usa Oxc com a transformador natiu. No cal cap plugin addicional per als decoradors NestJS.

6. **Crear `src/back/tsconfig.vitest.json`**:

   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "types": ["vitest/globals"]
     }
   }
   ```

7. **Migrar `app.controller.spec.ts`**: substituir `jest.fn()` per `vi.fn()` si n'hi ha (el scaffold no en té — verificar que el fitxer funciona amb Vitest sense canvis).

8. **Verificar**: `npm test` dins `src/back/` ha de reportar l'spec únic passat; `npm run test:cov` ha de produir un informe de cobertura.

**Rollback**: restaurar el bloc `"jest"` a `package.json` i revertir `scripts`. No hi ha canvis de BD ni d'API.

## Preguntes obertes

- S'hauria de migrar `test:e2e` a Vitest eventualment? (Seguiment pendent, no en aquest canvi.)
- S'hauria d'enforçar un llindar de cobertura (p. ex. 80% per als nous fitxers)? (A decidir quan la cobertura creixi més enllà del scaffold actual.)
