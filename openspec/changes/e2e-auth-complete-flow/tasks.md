## 1. Configuració i Setup de Playwright E2E

- [ ] 1.1 Verificar que la configuració de Playwright a `e2e/playwright.config.ts` suporta tests d'autenticació (URL base, configuració de timeouts, reintentos)
- [ ] 1.2 Assegurar que `e2e/fixtures/index.ts` exporta tots els tipus de fixture (auth, reset, page models)
- [ ] 1.3 Verificar que `e2e/fixtures/users.ts` conté usuaris de test amb els rols COACH i CLIENT per a tests de login

## 2. Page Models per als Formularis d'Autenticació

- [ ] 2.1 Crear `e2e/fixtures/pages/LoginPage.ts` amb mètodes: `fillUsername()`, `fillPassword()`, `clickSubmit()`, `getErrorMessage()`, `getSuccessMessage()`
- [ ] 2.2 Crear `e2e/fixtures/pages/RegisterPage.ts` amb mètodes: `fillUsername()`, `fillEmail()`, `fillPassword()`, `fillPasswordConfirmation()`, `clickSubmit()`, `getErrorMessage()`, `getSuccessMessage()`
- [ ] 2.3 Actualitzar `e2e/fixtures/index.ts` per exportar LoginPage i RegisterPage
- [ ] 2.4 Afegir atributs `data-testid` als components de Login i Register si no estan presents (executar linter per validar)

## 3. Estendre Fixtures d'Autenticació

- [ ] 3.1 Afegir funció ajudant `registerNewUser()` a `e2e/fixtures/auth.ts` que crida `POST /api/auth/register` i retorna `{ userId, token, user }`
- [ ] 3.2 Afegir utilitat `createTestUser()` que genera noms d'usuari únics amb suffix de timestamp+aleatori per evitar col·lisions
- [ ] 3.3 Actualitzar `e2e/fixtures/reset.ts` per netejar dades de test creades durant tests de registre (opcional: esborrar usuaris temporals més vells que 1 hora)

## 4. Tests E2E de Registre

- [ ] 4.1 Escriure test: "Registre › Registre exitós de nou usuari" — omplir formulari amb credencials úniques, enviar, verificar redirecció i token a localStorage
- [ ] 4.2 Escriure test: "Registre › Registre amb nom d'usuari duplicat" — intentar registrar-se amb usuari existent, verificar error HTTP 409 mostrat
- [ ] 4.3 Escriure test: "Registre › Registre amb format de correu electrònic invàlid" — enviar amb correu electrònic invàlid, verificar error de validació del client
- [ ] 4.4 Escriure test: "Registre › Registre amb contrasenyes no coincidents" — enviar amb contrasenyes no coincidents, verificar error de validació
- [ ] 4.5 Escriure test: "Registre › Registre amb camps requerits buits" — enviar formulari buit, verificar errors de validació HTML5
- [ ] 4.6 Escriure test: "Registre › Assignació de rol després de registre" — registrar-se i verificar que el rol assignat (COACH o CLIENT) pot iniciar sessió al dashboard correcte

## 5. Tests E2E de Login amb Credencials Vàlides

- [ ] 5.1 Escriure test: "Login › Login exitós com a COACH" — iniciar sessió amb credencials de COACH, verificar redirecció a /dashboard, verificar token a localStorage
- [ ] 5.2 Escriure test: "Login › Login exitós com a CLIENT" — iniciar sessió amb credencials de CLIENT, verificar redirecció a /client-home, verificar token a localStorage
- [ ] 5.3 Escriure test: "Login › El formulari de login mostra tots els camps requerits" — navegar a /login, verificar que nom d'usuari, contrasenya i botó d'enviament són visibles
- [ ] 5.4 Escriure test: "Login › El formulari de login s'envia via tecla Enter" — omplir formulari i prémer Retorn, verificar mateix comportament que fer clic a enviar

## 6. Tests E2E de Login amb Credencials Invàlides

- [ ] 6.1 Escriure test: "Login › Login amb contrasenya incorrecta" — introduir nom d'usuari vàlid però contrasenya incorrecta, verificar error HTTP 401, cap token emmagatzemat, usuari roman a pàgina de login
- [ ] 6.2 Escriure test: "Login › Login amb nom d'usuari inexistent" — introduir nom d'usuari inexistent, verificar error genèric HTTP 401, cap token emmagatzemat
- [ ] 6.3 Escriure test: "Login › Missatge d'error mostrat en configuració local correcta" — canviar configuració local del navegador a espanyol/anglès, iniciar sessió amb contrasenya incorrecta, verificar missatge d'error traduït
- [ ] 6.4 Escriure test: "Login › Múltiples intents de login fallits no bloquegen el compte" — fer 5+ intents fallits, verificar que el 6è intent funciona (sense limitació de velocitat)

## 7. Tests E2E de Logout

- [ ] 7.1 Escriure test: "Logout › Logout exitós neteja el token" — iniciar sessió, fer clic a botó de logout, verificar localStorage netejat, redirigit a /login
- [ ] 7.2 Escriure test: "Logout › Logout del dashboard del coach" — iniciar sessió com a COACH, fer clic a logout del dashboard, verificar redirecció a /login
- [ ] 7.3 Escriure test: "Logout › Logout del dashboard del client" — iniciar sessió com a CLIENT, fer clic a logout del dashboard, verificar redirecció a /login
- [ ] 7.4 Escriure test: "Logout › La ruta protegida és inaccessible després de logout" — iniciar sessió, logout, navegar directament a /dashboard, verificar redirecció a /login
- [ ] 7.5 Escriure test: "Logout › Les crides API després de logout retornen 401" — iniciar sessió, logout, intentar cridada API (p. ex., obtenir perfil d'usuari), verificar 401 i redirecció a /login

## 8. Tests E2E de Persistència de Sessió

- [ ] 8.1 Escriure test: "Persistència de Sessió › Token persista a localStorage després de login" — iniciar sessió, verificar token a localStorage via `page.evaluate()`, recarregar pàgina, verificar token encara present i inmodificat
- [ ] 8.2 Escriure test: "Persistència de Sessió › L'usuari roman autenticat després de recarregar pàgina" — iniciar sessió, recarregar pàgina, verificar AuthContext restaurat, navbar mostra nom d'usuari
- [ ] 8.3 Escriure test: "Persistència de Sessió › Dashboard accessible sense re-login després de recarregar" — iniciar sessió al dashboard de COACH, recarregar, verificar que segueix al dashboard
- [ ] 8.4 Escriure test: "Persistència de Sessió › La sessió persista en múltiples navegacions" — iniciar sessió, navegar entre /dashboard, /clients, recarregar en cada una, verificar token inmodificat, cap redirecció inesperada
- [ ] 8.5 Escriure test: "Persistència de Sessió › La sessió s'invalida quan el token es neteja de localStorage" — iniciar sessió, netejar manualment localStorage, recarregar, verificar redirecció a /login
- [ ] 8.6 Escriure test: "Persistència de Sessió › El token vençut declanxa re-login en la següent cridada API" — (opcional, requereix mocking d'expiració JWT) iniciar sessió, esperar a que caduqui el token, intentar cridada API, verificar 401 i redirecció

## 9. Validació d'i18n

- [ ] 9.1 Verificar que totes les claus relacionades amb autenticació existeixen a `src/front/src/i18n/locales/ca.json` amb valors no buits (registre, login, logout, missatges d'error)
- [ ] 9.2 Verificar que totes les claus relacionades amb autenticació existeixen a `src/front/src/i18n/locales/es.json` amb traduccions espanyoles correctes
- [ ] 9.3 Verificar que totes les claus relacionades amb autenticació existeixen a `src/front/src/i18n/locales/en.json` amb traduccions angleses correctes
- [ ] 9.4 Afegir/verificar aquestes claus si manquen:
  - `auth.register.title`
  - `auth.register.username`
  - `auth.register.email`
  - `auth.register.password`
  - `auth.register.confirmPassword`
  - `auth.register.submit`
  - `auth.register.success`
  - `auth.login.title`
  - `auth.login.username`
  - `auth.login.password`
  - `auth.login.submit`
  - `auth.login.invalidCredentials`
  - `auth.logout.title`
  - `auth.logout.success`

## 10. Execució i Validació de Tests E2E

- [ ] 10.1 Executar `cd e2e && npm test` localment per executar tots els tests d'autenticació, verificar taxa de pass del 100%
- [ ] 10.2 Executar `npm test -- --headed` per inspeccionar visualment els fluxos de test al navegador (verificació spotcheck de escenaris clau)
- [ ] 10.3 Executar `npm test -- auth.spec.ts` per executar només tests d'autenticació en aïllament
- [ ] 10.4 Executar tests múltiples vegades (3+ execucions) per verificar consistència i cap inestabilitat
- [ ] 10.5 Comprovar `e2e/test-results/` per a qualsevol snapshot fallida o avisos de timeout

## 11. Verificació del Backend

- [ ] 11.1 Executar `cd src/back && npm run lint` — verificar cap error de linting al mòdul d'autenticació
- [ ] 11.2 Executar `cd src/back && npm run build` — verificar que TypeScript es construeix correctament
- [ ] 11.3 Executar `cd src/back && npm test` — verificar que els tests unitaris d'autenticació existents segueixen passant (si n'hi ha)
- [ ] 11.4 Verificar que els endpoints d'autenticació són accessibles: `curl http://localhost:3000/api/auth/register` i `curl http://localhost:3000/api/auth/login` (amb dades POST)

## 12. Verificació del Frontend

- [ ] 12.1 Executar `cd src/front && npm run lint` — verificar cap error de linting a la característica d'autenticació
- [ ] 12.2 Executar `cd src/front && npm run build` — verificar que la construcció de Vite es completa correctament
- [ ] 12.3 Navegar a `http://localhost:5173/login` i `http://localhost:5173/register` al navegador — verificar que les pàgines es renderitzen sense errors de consola
- [ ] 12.4 Provar registre i login manualment al navegador per verificar UI/UX

## 13. Documentació i Comentaris de Codi

- [ ] 13.1 Afegir comentaris als nous page models explicant l'estratègia de selectores i propòsit de cada mètode
- [ ] 13.2 Afegir comentaris als tests E2E explicant quin escenari es prova i per què
- [ ] 13.3 Actualitzar `e2e/README.md` amb: (1) com executar tests E2E, (2) com executar tests d'autenticació específics, (3) resolució de problemes de tests inestables, (4) com depurar tests amb indicador `--headed`
- [ ] 13.4 Afegir notes específiques de test a `doc/Proves_usuari.md` documentant passos de QA manual que complementen els tests automatitzats

## 14. Checklist Final

- [ ] 14.1 Tots els tests E2E d'autenticació passen localment 3+ vegades sense inestabilitat
- [ ] 14.2 `npm run lint` passa per front i back
- [ ] 14.3 `npm run build` reïxeix per front i back
- [ ] 14.4 Totes les claus i18n són presents i traduïdes a ca.json, es.json, en.json
- [ ] 14.5 Cap secret o credencial hardcoded en fitxers de test (utilitzar fixtures/users.ts per a dades de test)
- [ ] 14.6 Els page models són reutilitzables i ben documentats per a tests futurs
- [ ] 14.7 Verificar que no hi ha contaminació de dades — reset.ts neteja usuaris de test després de cada execució de test
- [ ] 14.8 El missatge de commit de Git segueix commits convencionals: `test(e2e): add comprehensive auth flow tests`
- [ ] 14.9 Crear PR i demanar revisió
- [ ] 14.10 Després de fusionar, verificar que els tests passen en el gasoducte CI/CD (GitHub Actions)
