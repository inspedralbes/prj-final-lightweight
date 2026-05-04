## 1. Instal·lar les dependències de Vitest

- [x] 1.1 Dins `src/front/`, instal·lar Vitest i els paquets de testing: `npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [x] 1.2 Verificar que els nous paquets apareixen a `devDependencies` de `src/front/package.json`

## 2. Actualitzar la configuració de vite.config.ts

- [x] 2.1 Canviar l'import de `defineConfig` de `"vite"` a `"vitest/config"` a `src/front/vite.config.ts`
- [x] 2.2 Afegir la clau `test` al `defineConfig` de `src/front/vite.config.ts` amb `globals: true`, `environment: 'jsdom'` i `setupFiles: ['./src/test/setup.ts']`
- [x] 2.3 Afegir el resolve alias `@/` dins la clau `test` (o verificar que l'alias de `resolve.alias` ja és heretat per Vitest)

## 3. Actualitzar package.json amb els scripts de test

- [x] 3.1 Afegir l'script `"test"` a `src/front/package.json` amb valor `"vitest run"`
- [x] 3.2 Afegir l'script `"test:watch"` amb valor `"vitest"`
- [x] 3.3 Afegir l'script `"test:cov"` amb valor `"vitest run --coverage"`

## 4. Actualitzar la configuració de TypeScript

- [x] 4.1 Afegir `"vitest/globals"` a `compilerOptions.types` de `src/front/tsconfig.app.json`

## 5. Crear el fitxer de setup

- [x] 5.1 Crear el directori `src/front/src/test/` si no existeix
- [x] 5.2 Crear `src/front/src/test/setup.ts` que importi `@testing-library/jest-dom`

## 6. Crear el test bàsic

- [x] 6.1 Crear `src/front/src/test/basic.test.tsx` que renderitzi un component React simple (p.ex. un `<div>` amb text) amb `render` de `@testing-library/react` i asserti la seva presència al DOM amb `toBeInTheDocument()`

## 7. Verificació

- [x] 7.1 Executar `npm test` dins `src/front/` i confirmar que Vitest reporta almenys 1 test passat
- [x] 7.2 Executar `npm run test:cov` dins `src/front/` i confirmar que es genera un informe de cobertura
- [x] 7.3 Executar `npm run build` dins `src/front/` (`tsc -b && vite build`) i confirmar que la build de producció no té errors
- [x] 7.4 Executar `npm run lint` dins `src/front/` i confirmar que no hi ha nous errors de lint
