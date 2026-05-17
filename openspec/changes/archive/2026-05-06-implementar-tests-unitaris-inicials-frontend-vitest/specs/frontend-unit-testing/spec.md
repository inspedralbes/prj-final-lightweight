## ADDED Requirements

### Requirement: Tests unitaris de components compartits

El sistema HAURÀ DE proporcionar tests unitaris per als components compartits `ConfirmModal` i `LoadingScreen` que verifiquin el seu comportament visible al DOM.

#### Scenario: ConfirmModal mostra títol, missatge i botons

- **QUAN** es renderitza `<ConfirmModal title="Eliminar" message="Segur?" onConfirm={fn} onCancel={fn} />`
- **LLAVORS** el DOM HAURÀ DE contenir el text "Eliminar", el text "Segur?", un botó "Confirmar" i un botó "Cancelar"

#### Scenario: ConfirmModal crida onConfirm en fer clic al botó de confirmació

- **QUAN** l'usuari fa clic al botó "Confirmar"
- **LLAVORS** la funció `onConfirm` HAURÀ DE ser cridada exactament una vegada

#### Scenario: ConfirmModal crida onCancel en fer clic al botó de cancel·lació

- **QUAN** l'usuari fa clic al botó "Cancelar" o a la icona de tancament
- **LLAVORS** la funció `onCancel` HAURÀ DE ser cridada exactament una vegada

#### Scenario: ConfirmModal desactiva els botons quan loading és true

- **QUAN** es renderitza amb `loading={true}`
- **LLAVORS** els botons "Confirmar" i "Cancelar" HAURAN DE tenir l'atribut `disabled`

#### Scenario: LoadingScreen no es renderitza quan isVisible és false

- **QUAN** es renderitza `<LoadingScreen isVisible={false} />`
- **LLAVORS** el DOM NO HAURÀ DE contenir cap element visible del component de càrrega

#### Scenario: LoadingScreen es renderitza amb el missatge quan isVisible és true

- **QUAN** es renderitza `<LoadingScreen isVisible={true} message="Carregant..." />`
- **LLAVORS** el DOM HAURÀ DE contenir el text "Carregant..."

### Requirement: Tests unitaris de la utilitat HTTP api.ts

El sistema HAURÀ DE proporcionar tests unitaris per a `src/front/src/shared/utils/api.ts` que verifiquin els interceptors d'autenticació.

#### Scenario: L'interceptor de request afegeix el token de localStorage

- **QUAN** `localStorage` conté un valor per a la clau `token` i es fa una petició via `api`
- **LLAVORS** la capçalera `Authorization` de la petició HAURÀ DE ser `Bearer <token>`

#### Scenario: L'interceptor de request no afegeix capçalera si no hi ha token

- **QUAN** `localStorage` no conté cap valor per a la clau `token` i es fa una petició via `api`
- **LLAVORS** la petició NO HAURÀ DE contenir la capçalera `Authorization`

#### Scenario: L'interceptor de response neteja localStorage en rebre un 401

- **QUAN** el servidor retorna un error amb status 401
- **LLAVORS** `localStorage.removeItem` HAURÀ DE ser cridat per a les claus `token`, `username`, `userRole` i `userId`

### Requirement: Tests unitaris del context AuthContext

El sistema HAURÀ DE proporcionar tests unitaris per a `AuthContext` que verifiquin les operacions d'autenticació.

#### Scenario: AuthContext exposa user null inicialment si no hi ha dades a localStorage

- **QUAN** es munta un component que consumeix `AuthContext` sense dades prèvies a `localStorage`
- **LLAVORS** el valor `user` exposat pel context HAURÀ DE ser `null`

#### Scenario: AuthContext carrega l'usuari des de localStorage en el muntatge

- **QUAN** `localStorage` conté `token`, `userId`, `username`, `userRole` vàlids i es munta el `AuthProvider`
- **LLAVORS** el context HAURÀ D'exposar un objecte `user` amb els mateixos valors

#### Scenario: logout neteja l'estat i localStorage

- **QUAN** es crida la funció `logout` del context
- **LLAVORS** `user` HAURÀ DE passar a `null` i `localStorage` HAURÀ DE quedar sense les claus d'autenticació

### Requirement: Patró de test-utils reutilitzable

El sistema HAURÀ DE proporcionar un fitxer `src/front/src/test/test-utils.tsx` amb helpers que simplifiquin el setup de tests per a components que necessiten contextos.

#### Scenario: renderWithAuthContext renderitza components amb AuthContext mockat

- **QUAN** un test usa `renderWithAuthContext(<MyComponent />, { user: mockUser })`
- **LLAVORS** el component HAURÀ DE tenir accés al context amb el `user` i `logout` proporcionats sense errors de context no trobat

#### Scenario: Els test-utils re-exporta tot de @testing-library/react

- **QUAN** un test importa des de `@/test/test-utils`
- **LLAVORS** HAURÀ DE poder usar `screen`, `fireEvent`, `waitFor` i altres utilitats de `@testing-library/react` directament des d'aquest import
