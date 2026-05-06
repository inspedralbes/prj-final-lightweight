## 1. Test-utils i infraestructura de suport

- [x] 1.1 Crear `src/front/src/test/test-utils.tsx` amb el helper `renderWithAuthContext` i re-exportació de `@testing-library/react`
- [x] 1.2 Verificar que `npm test` passa en verd amb el test bàsic existent (`src/test/basic.test.tsx`)

## 2. Tests de components compartits

- [x] 2.1 Crear `src/front/src/shared/components/__tests__/ConfirmModal.test.tsx` amb els escenaris: renderitza títol/missatge/botons, crida `onConfirm`, crida `onCancel`, desactiva botons amb `loading={true}`
- [x] 2.2 Crear `src/front/src/shared/components/__tests__/LoadingScreen.test.tsx` amb els escenaris: no es renderitza quan `isVisible={false}`, mostra el missatge quan `isVisible={true}`

## 3. Tests de la utilitat HTTP

- [x] 3.1 Crear `src/front/src/shared/utils/__tests__/api.test.ts` amb els escenaris: interceptor afegeix token, no afegeix capçalera sense token, interceptor 401 neteja localStorage
- [x] 3.2 Mockejar `window.location` amb `vi.stubGlobal` per evitar errors de navegació en l'interceptor 401

## 4. Tests del context AuthContext

- [x] 4.1 Crear `src/front/src/features/auth/context/__tests__/AuthContext.test.tsx` amb els escenaris: `user` null sense localStorage, carrega usuari des de localStorage, `logout` neteja estat i localStorage

## 5. Verificació final

- [x] 5.1 Executar `npm test` a `src/front/` i confirmar que tots els tests passen en verd
- [x] 5.2 Executar `npm run build` a `src/front/` i confirmar que la build de producció no té errors
- [x] 5.3 Executar `npm run lint` a `src/front/` i confirmar que no hi ha errors de linting nous
