## 1. Eliminar Jest i instal·lar les dependències de Vitest

- [x] 1.1 Dins `src/back/`, desinstal·lar els paquets de Jest: `npm uninstall jest ts-jest @types/jest`
- [x] 1.2 Dins `src/back/`, instal·lar Vitest i els paquets necessaris: `npm install --save-dev vitest @vitest/coverage-v8 unplugin-swc @swc/core`
- [x] 1.3 Verificar que `jest`, `ts-jest` i `@types/jest` ja no apareixen com a entrades directes a `devDependencies` de `src/back/package.json`

## 2. Actualitzar la configuració de package.json

- [x] 2.1 Eliminar el bloc de configuració `"jest"` de nivell superior de `src/back/package.json`
- [x] 2.2 Actualitzar l'script `"test"` a `src/back/package.json` a `"vitest run"`
- [x] 2.3 Actualitzar l'script `"test:watch"` a `"vitest"`
- [x] 2.4 Actualitzar l'script `"test:cov"` a `"vitest run --coverage"`
- [x] 2.5 Verificar que l'script `"test:e2e"` no ha canviat (`jest --config ./test/jest-e2e.json`)

## 3. Crear la configuració de Vitest

- [x] 3.1 Crear `src/back/vitest.config.ts` amb `defineConfig`, `test.globals: true`, `test.environment: 'node'` i el plugin `unplugin-swc` configurat amb `module.type: 'commonjs'`, `jsc.parser.decorators: true`, `jsc.transform.legacyDecorator: true` i `jsc.transform.decoratorMetadata: true`
- [x] 3.2 Crear `src/back/tsconfig.vitest.json` que estengui `./tsconfig.json` i afegeixi `"types": ["vitest/globals"]` a `compilerOptions`

## 4. Migrar el spec existent

- [x] 4.1 Obrir `src/back/src/app.controller.spec.ts` i confirmar que no usa imports específics de Jest (`jest.fn`, `@types/jest`, etc.); eliminar-los si n'hi ha (el scaffold no en té, però cal verificar)
- [x] 4.2 Confirmar que `describe`, `it`, `expect` i `beforeEach` al spec s'usen com a globals (no cal import amb `globals: true`)

## 5. Verificació

- [x] 5.1 Executar `npm test` dins `src/back/` i confirmar que Vitest reporta 1 test passat (`AppController › root › should return "Hello World!"`)
- [x] 5.2 Executar `npm run test:cov` dins `src/back/` i confirmar que es genera un informe de cobertura a `src/back/coverage/`
- [x] 5.3 Executar `npm run build` dins `src/back/` (`nest build`) i confirmar que no hi ha errors de TypeScript
- [x] 5.4 Executar `npm run lint` dins `src/back/` i confirmar que no hi ha nous errors de lint
- [x] 5.5 (Opcional) Executar `npm run test:e2e` dins `src/back/` i confirmar que la suite e2e no es veu afectada (requereix una BD en execució; ometre en entorns sense BD i documentar com a manual)
