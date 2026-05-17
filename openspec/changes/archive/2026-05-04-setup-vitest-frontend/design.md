## Context

El frontend (`src/front/`) utilitza Vite 7 com a bundler i no té cap test runner configurat avui dia. La verificació depèn del checklist manual de `doc/Proves_usuari.md` i dels checks de tipus amb `tsc -b && vite build`. El backend ja va migrar a Vitest (LW-448), de manera que adoptar Vitest al frontend unifica el tooling de testing del monorepo.

El frontend és una SPA React 19 + TypeScript 5.9. La configuració de producció es troba a `src/front/vite.config.ts`. El path alias `@/` apunta a `src/front/src/`.

## Objectius / Fora d'àmbit

**Objectius:**

- Afegir Vitest com a test runner per al frontend React + Vite (`src/front/`).
- Configurar l'entorn jsdom per poder renderitzar components React als tests.
- Integrar `@testing-library/react` + `@testing-library/jest-dom` per a assertions de DOM.
- Mantenir el `vite.config.ts` de producció intacte (configuració de tests en un fitxer separat o com a clau `test` dins `vite.config.ts`).
- Proporcionar un test bàsic funcional que validi que el harness opera correctament.
- Afegir scripts `test`, `test:watch`, `test:cov` a `src/front/package.json`.

**Fora d'àmbit:**

- Afegir cobertura de tests per als components i serveis existents.
- Testejar fluxos de Socket.IO o WebRTC.
- Configurar MSW (Mock Service Worker) per a tests d'integració HTTP.

## Decisions

### Decisió 1 — Vitest integrat dins `vite.config.ts` (clau `test`)

Opcions considerades:

| Opció                                      | Avantatges                                                 | Inconvenients                                                   |
| ------------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Clau `test` dins `vite.config.ts` existent | Reutilitza plugins ja definits (react, tailwind, @/ alias) | Barreja config de dev/build amb config de test en un sol fitxer |
| `vitest.config.ts` separat                 | Separació clara de responsabilitats                        | Cal repetir o importar els plugins i l'alias `@/` de Vite       |

**Decisió**: integrar la clau `test` directament a `vite.config.ts` canviant `defineConfig` de `vite` per `defineConfig` de `vitest/config`. Això fa que Vitest hereti automàticament els plugins (`@vitejs/plugin-react`, `@tailwindcss/vite`) i el resolve alias (`@/`), sense duplicació de configuració.

### Decisió 2 — Entorn jsdom

Per poder renderitzar components React als tests, cal un entorn DOM. Opcions:

- **`jsdom`** ✅ escollit: és l'estàndard a l'ecosistema `@testing-library/react`. No requereix Chromium.
- **`happy-dom`**: alternativa més lleugera, però menys compatible amb algunes APIs de DOM. No hi ha motiu per desviar-se de jsdom en aquest projecte.

La configuració serà `environment: 'jsdom'` a la clau `test`.

### Decisió 3 — Setup file per a `@testing-library/jest-dom`

`@testing-library/jest-dom` estén les matchers de Vitest (`expect`) amb assertions com `toBeInTheDocument()`, `toHaveClass()`, etc. Per fer-les disponibles globalment a tots els tests, es crea un fitxer `src/front/src/test/setup.ts` que importa `@testing-library/jest-dom` i es referencia com a `setupFiles` a la config de Vitest.

### Decisió 4 — `globals: true`

Activar `globals: true` fa que `describe`, `it`, `expect`, `beforeEach`, `vi` estiguin disponibles sense imports explícits, consistent amb el patró establert al backend. Cal afegir `"types": ["vitest/globals"]` a `tsconfig.app.json` (o a un tsconfig específic de tests) per satisfer TypeScript.

### Decisió 5 — `@vitest/coverage-v8` com a backend de cobertura

Consistent amb la decisió adoptada al backend (LW-448). No requereix una transformació addicional; usa el coverage natiu de V8.

## Riscos / Compromisos

| Risc                                                                                                     | Mitigació                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jsdom` no implementa totes les APIs de browser (ex. `matchMedia`, `ResizeObserver`)                     | Per al test bàsic no hi ha impacte. Tests futurs hauran de mockejar les APIs mancants on sigui necessari.                                                                                   |
| Afegir `"types": ["vitest/globals"]` a `tsconfig.app.json` pot contaminar tipus als fitxers de producció | Limitar el canvi a `compilerOptions.types` o usar un `tsconfig.test.json` que estengui `tsconfig.app.json` per a contexts més estrictes. L'impacte pràctic és mínim per al harness inicial. |
| `@tailwindcss/vite` en context de test pot generar advertiments                                          | Tailwind no processa CSS en tests jsdom; és inofensiu però pot produir warnings. Si molesta, es pot excloure el plugin en l'entorn `test`.                                                  |

## Pla de migració

1. **Instal·lar dev dependencies** dins `src/front/`:

   ```bash
   npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. **Modificar `vite.config.ts`**: canviar l'import de `defineConfig` per `vitest/config` i afegir la clau `test`:

   ```ts
   import { defineConfig } from "vitest/config";
   // ...plugins i alias es mantenen igual...

   export default defineConfig({
     // ...configuració existent...
     test: {
       globals: true,
       environment: "jsdom",
       setupFiles: ["./src/test/setup.ts"],
       alias: {
         "@/": new URL("./src/", import.meta.url).pathname,
       },
     },
   });
   ```

3. **Crear `src/front/src/test/setup.ts`**:

   ```ts
   import "@testing-library/jest-dom";
   ```

4. **Actualitzar `tsconfig.app.json`**: afegir `"vitest/globals"` a `compilerOptions.types`.

5. **Afegir scripts a `src/front/package.json`**:

   ```json
   "test": "vitest run",
   "test:watch": "vitest",
   "test:cov": "vitest run --coverage"
   ```

6. **Crear un test bàsic** (`src/front/src/test/basic.test.tsx`) que renderitzi un component simple i assegurin que el DOM es renderitza correctament.

7. **Verificar**: `npm test` ha de passar en verd.
