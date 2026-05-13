# LightWeight — Tests E2E

> Suite Playwright per a tests end-to-end. Cobreix **LW-438** (workspace + smoke) i **LW-440** (seed determinista + fixtures multi-usuari).

## Instal·lació

```bash
cd e2e
npm install
npx playwright install chromium
```

## Executar el smoke test

Arrenca el frontend en un altre terminal (ha de quedar escoltant a `http://localhost:5173`):

```bash
cd src/front && npm run dev
```

Després, des de `e2e/`:

```bash
npm run test:e2e:browser
```

Resultat esperat: `2 passed` (smoke + seed).

---

## Dades de prova

### 1. Arrencar el backend amb el flag `E2E_TESTING`

Els tests que usen les fixtures (`loginAs`, `resetDatabase`) necessiten que el backend exposi els endpoints `/testing/reset`, `/testing/seed` i `/testing/login`. Aquests endpoints només es munten si el backend arrenca amb `E2E_TESTING=true`:

```bash
# Local (sense Docker):
cd src/back
E2E_TESTING=true npm run start:dev

# O dins de Docker (afegeix E2E_TESTING=true al .env de l'arrel i reinicia):
docker compose up -d --build backend
```

> ⚠️ **Mai** estableixis `E2E_TESTING=true` en producció. El backend té una doble guarda: si `NODE_ENV=production`, ignora el flag i els endpoints retornen 404.

> ⚠️ El secret `ENV_FILE` que la GitHub Action `deploy.yml` injecta en producció **no ha de** contenir `E2E_TESTING=true`. Abans de fer merge a `main`, comprova el contingut del secret a GitHub.

### 2. Executar el seed inicial

Des de `src/back/`, amb la BD engegada:

```bash
cd src/back
npx prisma db seed
```

El seed és idempotent (usa `upsert`), de manera que es pot executar diverses vegades sense error.

### 3. Usuaris disponibles

| Nom d'usuari | Rol | Vincle | Contrasenya |
|---|---|---|---|
| `e2e_coach` | COACH | — | `E2eP@ss123!` |
| `e2e_client_linked` | CLIENT | `coachId = e2e_coach.id` | `E2eP@ss123!` |
| `e2e_client_unlinked` | CLIENT | `coachId = null` | `E2eP@ss123!` |

A més, el seed crea: una rutina `e2e_routine_basic` propietat de `e2e_coach`, una assignació a `e2e_client_linked`, i una invitació pendent amb codi `E2E-INVITE-001`.

### 4. Usar les fixtures en un test

```ts
// e2e/tests/el-meu-flux.spec.ts
import { test, expect } from "../fixtures";

test("el coach veu el seu dashboard", async ({ loginAs }) => {
  const page = await loginAs("coach");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
});
```

- `loginAs(role)` ⇒ `Page` ja autenticada (token + dades a `localStorage`). Rols: `'coach' | 'clientLinked' | 'clientUnlinked'`.
- `freshDb` ⇒ fixture auto-run (`auto: true`) que crida `resetDatabase()` abans de cada test. Per desactivar-la en un bloc concret, `test.use({ freshDb: false })`.
- `resetDatabase()` ⇒ helper directe si necessites fer reset manualment dins d'un test.

### 5. Convenció de prefix `e2e_*`

`POST /testing/reset` només esborra usuaris el `username` dels quals comenci per `e2e_` (i tot el que en depèn en cascada). Si el teu test crea dades addicionals a mà, **respecta el prefix** (`e2e_extra_user`, `e2e_routine_xyz`) perquè el reset els netegi.

### 6. Reset / login manual des de la línia de comandes

```bash
# Reset complet (esborra e2e_*, torna a sembrar)
curl -X POST http://localhost:3000/testing/reset

# Login com a coach (retorna { access_token, user })
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"e2e_coach"}' \
  http://localhost:3000/testing/login

# Nom d'usuari no permès (HTTP 400)
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin"}' \
  http://localhost:3000/testing/login
```

> En dev local el backend viu a `:3000` directament (sense `/api`). El prefix `/api` només l'afegeix Nginx en producció.

---

## Tests d'Autenticació (LW-441)

Els tests d'autenticació cobreixen el flux complet de registre, inici de sessió, tancament de sessió i persistència.

### Què cobreixen:
- **Login**: Èxit com a COACH i CLIENT, errors per credencials incorrectes o usuari inexistent.
- **Registre**: Creació de nous usuaris amb rol dinàmic, validació d'errors (usuari duplicat, contrasenyes no coincidents).
- **Logout**: Tancament de sessió correcte i neteja de `localStorage`.
- **Persistència**: Verificació que la sessió es manté en recarregar la pàgina.

### Execució:

Per executar exclusivament els tests d'autenticació:

```bash
cd e2e
npx playwright test tests/auth.spec.ts
```

Per veure l'execució en temps real (mode UI):
```bash
npx playwright test tests/auth.spec.ts --ui
```

Si es volen executar tots els tests junts, cal afegir --workers=1:
```bash
npx playwright test --workers=1
```

### Page Objects
S'han introduït Page Objects per millorar la mantenibilitat:
- `LoginPage`: `/e2e/fixtures/pages/LoginPage.ts`
- `RegisterPage`: `/e2e/fixtures/pages/RegisterPage.ts`

Ús en tests:
```ts
test('exemple login', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login('usuari', 'contrasenya');
  await expect(page).toHaveURL(/\/dashboard/);
});
```

---

> La guia completa de testing E2E (depuració, Trace Viewer, convencions avançades) és a [doc/guia-testing-e2e.md](../doc/guia-testing-e2e.md).
