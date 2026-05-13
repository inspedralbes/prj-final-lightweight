# Guia de Testing E2E

Aquesta guia explica com treballar amb la suite de tests end-to-end amb Playwright del projecte LightWeight.

## Índex

- [Instal·lació i configuració](#installació-i-configuració)
- [Execució de tests](#execució-de-tests)
- [Organització i convencions](#organització-i-convencions)
- [Ús de fixtures de Playwright](#ús-de-fixtures-de-playwright)
- [Depuració de tests](#depuració-de-tests)
- [Playwright Trace Viewer](#playwright-trace-viewer)
- [Integració amb CI](#integració-amb-ci)

## Instal·lació i configuració

### Prerequisits

- Node.js 20+
- Docker i Docker Compose (per executar el stack complet en local)
- Git

### Instal·lar dependències

Navega al directori de tests E2E i instal·la les dependències:

```bash
cd e2e
npm install
npx playwright install chromium
```

### Arrencar el stack de l'aplicació

Els tests E2E requereixen que l'aplicació LightWeight estigui en marxa. Hi ha dues opcions:

#### Opció 1: Docker Compose (Recomanada)

1. Des de l'arrel del projecte, arrenca tots els serveis:

   ```bash
   docker compose up -d
   ```

2. Activa el mode de testing E2E establint la variable d'entorn:
   ```bash
   # En un terminal nou, o afegeix-ho a la sobreescriptura de docker-compose.yml
   docker exec -it lw-backend sh -c "export E2E_TESTING=true"
   ```

#### Opció 2: Configuració manual

1. Arrenca PostgreSQL (via Docker o localment)

2. Arrenca el backend amb E2E testing activat:

   ```bash
   cd src/back
   E2E_TESTING=true npm run start:dev
   ```

3. En un altre terminal, arrenca el frontend:
   ```bash
   cd src/front
   npm run dev
   ```

### Configuració de la base de dades

Executa les migracions i el seed de dades de prova:

```bash
cd src/back
npx prisma migrate deploy
npx prisma db seed
```

El seed crea els usuaris de prova i les dades inicials necessàries per als tests E2E.

### Verificar la configuració

Comprova que ambdós serveis estan en marxa:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

Pots verificar que els endpoints E2E del backend estan disponibles:

```bash
curl http://localhost:3000/testing/reset
```

## Execució de tests

### Comandes bàsiques

Des del directori `e2e/`, utilitza aquests scripts npm:

```bash
# Executar tots els tests E2E
npm run test:e2e:browser

# Executar tests amb la UI de Playwright per a depuració
npm run test:e2e:browser:ui

# Executar tests en mode debug (pas a pas interactiu)
npm run test:e2e:browser:debug
```

### Executar tests específics

Pots executar arxius de test individuals o usar les opcions de filtratge de Playwright:

```bash
# Executar un arxiu de test específic
npx playwright test tests/auth.spec.ts

# Executar tests que coincideixen amb un patró
npx playwright test --grep "login"

# Executar tests amb una etiqueta específica
npx playwright test --grep "@smoke"

# Executar tests d'un projecte específic (definit a playwright.config.ts)
npx playwright test --project chromium
```

### Opcions d'execució

La suite de tests està configurada amb aquests valors per defecte:

- **Workers**: 1 (execució seqüencial per evitar conflictes a la base de dades)
- **Timeout**: 30 segons per test
- **Reintents**: 2 en CI, 0 en local
- **Navegador**: Chromium (Desktop Chrome)
- **URL base**: http://localhost:5173 (configurable via `PLAYWRIGHT_BASE_URL`)

### Sortida dels tests

- **Consola**: Resultats dels tests al terminal
- **Captures de pantalla**: Capturades en cas de falla (guardades a `test-results/`)
- **Vídeos**: Gravats en cas de falla (guardats a `test-results/`)
- **Traces**: Generades en el primer reintent (per a depuració)

### Advertència sobre execució paral·lela

⚠️ **Important**: Els tests s'executen amb `workers: 1` perquè comparteixen la mateixa base de dades. L'execució paral·lela causaria condicions de carrera durant els resets de la base de dades. Si necessites executar tests en paral·lel, assegura't que cada worker utilitza una instància de base de dades separada.

## Organització i convencions

### Estructura de fitxers

```
e2e/
├── tests/                    # Arxius de test
│   ├── auth.spec.ts         # Tests d'autenticació
│   ├── routines.spec.ts     # Tests de gestió de rutines
│   ├── coop-session.spec.ts # Tests de sessió cooperativa
│   └── ...
├── fixtures/                # Fixtures i utilitats de test
│   ├── index.ts            # Definicions principals de fixtures
│   ├── auth.ts             # Helpers d'autenticació
│   ├── users.ts            # Definicions d'usuaris de prova
│   ├── two-contexts.ts     # Configuració de context multi-usuari
│   ├── pages/              # Page Object Models
│   │   ├── LoginPage.ts
│   │   └── RegisterPage.ts
│   └── reset.ts            # Utilitats de reset de base de dades
├── playwright.config.ts     # Configuració de Playwright
└── package.json            # Dependències i scripts de test
```

### Convencions de nomenclatura

- **Arxius de test**: Extensió `.spec.ts` amb noms descriptius (p. ex., `auth.spec.ts`, `invitations.spec.ts`)
- **Casos de test**: Noms descriptius que expliquen l'escenari que es prova
- **Page Objects**: Nomenats d'acord amb la pàgina/component que representen (p. ex., `LoginPage`, `RegisterPage`)
- **Fixtures**: camelCase per als noms de fixtures (p. ex., `loginAs`, `twoContexts`)

### Convencions de dades de test

- **Prefix d'usuari**: Totes les dades de test usen el prefix `e2e_` per distingir-les de les dades de producció
- **Neteja de la base de dades**: La fixture `freshDb` reseteja automàticament la base de dades abans de cada test
- **Operacions idempotents**: El seed de la base de dades és idempotent i es pot executar múltiples vegades

### Categories de tests

La suite de tests cobreix aquestes àrees principals:

- **Autenticació**: Login, registre, logout, persistència de sessió
- **Rutines**: Creació, edició i assignació de rutines d'exercicis
- **Invitacions**: Vinculació coach-client via codis o noms d'usuari
- **Sessions cooperatives**: Sessions d'entrenament en temps real entre coach i client
- **Tests de fum**: Verificació de funcionalitat bàsica

### Page Objects

Utilitza Page Object Models per a millor mantenibilitat:

```typescript
// Exemple d'ús en un test
test("l'usuari pot iniciar sessió", async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.fillCredentials("user@example.com", "password");
  await loginPage.submit();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

Els Page Objects encapsulen selectors i accions, fent els tests més llegibles i fàcils de mantenir quan la UI canvia.

## Ús de fixtures de Playwright

La suite de tests utilitza fixtures personalitzades de Playwright per simplificar la configuració dels tests i proporcionar funcionalitat comuna.

### Fixtures disponibles

#### `freshDb`

Reseteja automàticament la base de dades abans de cada test per garantir un estat net.

```typescript
test("crea una nova rutina", async ({ freshDb, loginAs }) => {
  // La base de dades es reseteja automàticament aquí
  const page = await loginAs("coach");
  // El test continua amb la base de dades en estat net
});
```

#### `loginAs`

Inicia sessió com un rol d'usuari específic i retorna una pàgina autenticada.

```typescript
test("el coach veu el dashboard", async ({ loginAs }) => {
  const page = await loginAs("coach"); // Rols: 'coach', 'clientLinked', 'clientUnlinked'
  await page.goto("/dashboard");
  await expect(page.locator("h1")).toContainText("Dashboard");
});
```

Rols disponibles:

- `'coach'`: usuari e2e_coach
- `'clientLinked'`: e2e_client_linked (assignat al coach)
- `'clientUnlinked'`: e2e_client_unlinked (sense coach assignat)

#### `loginPage` i `registerPage`

Instàncies de Page Object per a les pàgines d'autenticació.

```typescript
test("login correcte", async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.fillCredentials("e2e_coach", "E2eP@ss123!");
  await loginPage.submit();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

#### `twoContexts` (Tests multi-usuari)

Crea dos contextos de navegador separats per a provar les interaccions entre coach i client.

```typescript
test("coach i client interactuen en una sessió", async ({ twoContexts }) => {
  const { coachPage, clientPage } = twoContexts;

  // El coach crea una sessió
  await coachPage.goto("/sessions");
  await coachPage.click("text=Crear sessió");
  const sessionCode = await coachPage.locator(".session-code").textContent();

  // El client s'uneix a la sessió
  await clientPage.goto("/join");
  await clientPage.fill('input[name="code"]', sessionCode);
  await clientPage.click("text=Unir-se");

  // Tots dos usuaris estan ara a la mateixa sessió
  await expect(coachPage.locator(".participant")).toContainText(
    "e2e_client_linked",
  );
  await expect(clientPage.locator(".coach-name")).toContainText("e2e_coach");
});
```

La fixture `twoContexts` proporciona:

- `coachContext` i `coachPage`: Context i pàgina del navegador del coach
- `clientContext` i `clientPage`: Context i pàgina del navegador del client

Tots dos contextos s'autentiquen automàticament i es netegen al final del test.

### Dades de test

Les fixtures utilitzen aquests usuaris de prova predefinits:

| Nom d'usuari          | Rol    | Coach assignat | Contrasenya   |
| --------------------- | ------ | -------------- | ------------- |
| `e2e_coach`           | COACH  | —              | `E2eP@ss123!` |
| `e2e_client_linked`   | CLIENT | `e2e_coach.id` | `E2eP@ss123!` |
| `e2e_client_unlinked` | CLIENT | `null`         | `E2eP@ss123!` |

### Fixtures personalitzades

Per crear fixtures personalitzades, estén la funció `test` a `fixtures/index.ts`:

```typescript
interface CustomFixtures {
  myCustomFixture: string;
}

export const test = base.extend<CustomFixtures>({
  myCustomFixture: async ({}, use) => {
    // Configuració
    await use("valor personalitzat");
    // Neteja
  },
});
```

### Desactivar fixtures automàtiques

Per desactivar el reset automàtic de la base de dades per a un test específic:

```typescript
test.use({ freshDb: false });
```

Útil quan vols provar la persistència d'estat entre múltiples operacions.

## Depuració de tests

### Depuració en local

#### Mode visual

Executa els tests amb una finestra de navegador visible per veure què passa:

```bash
# Usant l'script npm
npm run test:e2e:browser:ui

# O directament amb Playwright
npx playwright test --headed
```

#### Mode debug

Executa els tests pas a pas de forma interactiva:

```bash
# Usant l'script npm
npm run test:e2e:browser:debug

# O directament
npx playwright test --debug
```

En mode debug pots:

- Establir punts d'interrupció al codi del test
- Executar pas a pas
- Inspeccionar l'estat de la pàgina
- Usar `page.pause()` per aturar l'execució en punts concrets

#### Afegir instruccions de depuració

```typescript
test("exemple de debug", async ({ page }) => {
  console.log("Iniciant test...");
  await page.goto("/");
  console.log("Pàgina carregada:", page.url());

  // Atura l'execució per a inspecció manual
  await page.pause();

  // Afegeix punts d'interrupció al teu IDE
  debugger; // S'activa si s'executa amb --debug

  await page.click("button");
});
```

#### Inspecció d'elements

Usa el codegen de Playwright per veure com interactuar amb els elements:

```bash
npx playwright codegen http://localhost:5173
```

Obre un navegador on pots fer clic als elements i veure el codi generat.

### Anàlisi de fallades

#### Artefactes automàtics

En cas de falla d'un test, Playwright captura automàticament:

- **Captures de pantalla**: Instantània visual de la pàgina en el moment de la falla
- **Vídeos**: Gravació completa de l'execució del test
- **Traces**: Línia de temps detallada de l'execució (en el primer reintent)

Els artefactes es guarden a `e2e/test-results/`.

#### Visualitzar traces

Usa el Playwright Trace Viewer per analitzar les fallades:

```bash
npx playwright show-trace e2e/test-results/some-trace.zip
```

El Trace Viewer mostra:

- Peticions de xarxa
- Logs de la consola
- Captures de pantalla en cada pas
- Línia de temps d'accions

### Depuració en CI

#### Artefactes de GitHub Actions

Quan els tests fallen en CI, els artefactes es pugen automàticament:

- Navega a l'execució del workflow fallida
- Descarrega l'artefacte `e2e-report-{run_id}`
- Descomprimeix i examina el contingut

#### Problemes comuns en CI

1. **Timeouts**: Els tests poden anar més lents en CI per limitacions de recursos
   - Augmenta el timeout a `playwright.config.ts`
   - Comprova si hi ha condicions de carrera al test

2. **Tests inestables**: Tests que passen en local però fallen en CI
   - Usa reintents (ja configurat: 2 en CI)
   - Afegeix condicions d'espera en lloc de retards fixos
   - Comprova les assertions que depenen del temps

3. **Diferències d'entorn**
   - Assegura't que CI usa la mateixa versió de Node.js
   - Verifica que les variables d'entorn estan configurades correctament
   - Comprova que els serveis estan completament llestos abans d'executar els tests

#### Replicar CI en local

```bash
# Executar amb la mateixa configuració que CI
PLAYWRIGHT_BASE_URL=http://localhost:5173 npx playwright test --retries=2

# Executar en mode headless (com CI)
npx playwright test --headed=false
```

### Consells de resolució de problemes

- **Aïllament de tests**: Assegura't que els tests no depenen els uns dels altres
- **Estat de la base de dades**: Usa la fixture `freshDb` per garantir un estat net
- **Operacions asíncrones**: Espera que els elements/peticions de xarxa es completin
- **Selectors**: Usa selectors robustos (data-testid, atributs ARIA)
- **Condicions de carrera**: Afegeix esperes explícites per al contingut dinàmic

```typescript
// En lloc d'això (fràgil):
await page.click("button");

// Usa això (robust):
await page.locator("button").waitFor();
await page.click("button");
await page.waitForURL("**/expected-page");
```

## Playwright Trace Viewer

El Playwright Trace Viewer és una eina potent per analitzar l'execució dels tests i depurar fallades.

### Generar traces

Les traces es generen automàticament quan els tests fallen (configurat com `trace: "on-first-retry"`):

```bash
# Generar traces manualment per a tots els tests
npx playwright test --trace on

# Generar traces només en cas de falla
npx playwright test --trace retain-on-failure
```

### Visualitzar traces

Obre les traces al Trace Viewer:

```bash
# Visualitzar un arxiu de trace específic
npx playwright show-trace e2e/test-results/some-test-trace.zip

# Visualitzar la trace més recent
npx playwright show-trace e2e/test-results/
```

### Què mostren les traces

El Trace Viewer proporciona:

- **Línia de temps**: Execució pas a pas amb timestamps
- **Captures de pantalla**: Estat visual en cada acció
- **Xarxa**: Peticions i respostes HTTP
- **Logs de consola**: Sortida de la consola del navegador
- **Codi font**: Codi del test amb ressaltat d'execució
- **Detalls d'accions**: Coordenades de clics, text introduït, etc.

### Usar traces per a depurar

1. **Identificar el punt de falla**: Veure exactament on ha fallat el test
2. **Comprovar l'estat dels elements**: Verificar si els elements eren visibles/interactuables
3. **Problemes de xarxa**: Comprovar si les crides a l'API han fallat o han retornat dades inesperades
4. **Problemes de temps**: Veure si les accions s'han produït en l'ordre incorrecte
5. **Canvis visuals**: Comparar captures de pantalla abans i després de les accions

### Anàlisi de traces en CI

En fallades de CI:

1. Descarrega l'artefacte `e2e-report-{run_id}`
2. Extreu els arxius `.zip` de trace
3. Obre amb `npx playwright show-trace ruta/a/trace.zip`
4. Analitza la fallada sense tornar a executar en local

### Bones pràctiques

- **Activa traces en desenvolupament** per a la depuració de tests complexos
- **Revisa les traces regularment** per millorar la fiabilitat dels tests
- **Usa traces per documentar** el comportament esperat per a futurs mantenidors
- **Arxiva traces importants** per a l'anàlisi de regressions

## Integració amb CI

Els tests E2E s'executen automàticament a GitHub Actions en els pull requests i es poden activar manualment.

### Quan s'executen els tests

- **Pull Requests**: Els tests s'executen automàticament en crear o actualitzar un PR
- **Activació manual**: Usa el workflow "E2E Tests" des de la pestanya Actions
- **Branca main**: Els tests s'executen en cada push a `main` (normalment via PR)

### Entorn de CI

La pipeline de CI:

- Usa **Ubuntu latest** amb Node.js 20
- Executa **PostgreSQL 17** com a contenidor de servei
- Compila backend i frontend
- Arrenca els serveis i espera que estiguin llestos
- Executa la suite completa de tests amb reintents activats
- Puja artefactes de fallada (captures de pantalla, vídeos, traces)

### Configuració de CI

Paràmetres clau a `.github/workflows/e2e.yml`:

- **Workers**: 1 (execució seqüencial)
- **Reintents**: 2 intents en cas de falla
- **Timeout**: 30 segons per test
- **Artefactes**: Es conserven 7 dies en cas de falla

### Gestió de fallades en CI

#### Accedir als resultats

1. Ves a la pestanya "Checks" del PR o a la pestanya d'Actions
2. Fes clic al job "E2E Tests" fallat
3. Consulta la sortida del test als logs
4. Descarrega els artefactes si estan disponibles

#### Problemes comuns en CI

1. **Arrencada dels serveis**: El backend/frontend pot trigar més a arrencar en CI
   - El workflow espera fins a 60 segons per a cada servei

2. **Limitació de recursos**: Els runners de CI tenen CPU/memòria limitades
   - Els tests poden anar més lents que en local
   - Augmenta els timeouts si cal

3. **Diferències de base de dades**: CI usa una instància PostgreSQL nova
   - Assegura't que les migracions i el seed funcionen correctament
   - Comprova si hi ha suposicions de localhost hardcoded

#### Replicar CI en local

```bash
# Executar amb reintents com CI
npx playwright test --retries=2

# Executar en mode headless
npx playwright test --headed=false

# Usar la mateixa URL base
PLAYWRIGHT_BASE_URL=http://localhost:5173 npx playwright test
```

### Bones pràctiques de CI

- **Feedback ràpid**: Mantén els tests centrats i ràpids
- **Tests fiables**: Evita tests inestables que causen fallades falses
- **Seguretat paral·lela**: Els tests estan dissenyats per executar-se seqüencialment per la BD compartida
- **Ús d'artefactes**: Usa traces i vídeos per depurar sense tornar a executar

### Execucions manuals de CI

Per executar tests E2E manualment en CI:

1. Ves a la pestanya d'Actions de GitHub
2. Selecciona el workflow "E2E Tests (Playwright)"
3. Fes clic a "Run workflow"
4. Tria la branca a provar
