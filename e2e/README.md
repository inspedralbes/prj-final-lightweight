# LightWeight E2E Tests

> Harness Playwright para tests end-to-end. Cubre **LW-438** (workspace + smoke) y **LW-440** (seed determinista + fixtures multi-usuario).

## Instalación

```bash
cd e2e
npm install
npx playwright install chromium
```

## Ejecutar el smoke test

Arranca el frontend en otra terminal (debe quedar escuchando en `http://localhost:5173`):

```bash
cd src/front && npm run dev
```

Luego, desde `e2e/`:

```bash
npm run test:e2e:browser
```

Resultado esperado: `2 passed` (smoke + seed).

---

## Datos de prueba

### 1. Arrancar el back con el flag `E2E_TESTING`

Los tests que usan las fixtures (`loginAs`, `resetDatabase`) necesitan que el backend exponga los endpoints `/testing/reset`, `/testing/seed` y `/testing/login`. Estos endpoints solo se montan si el back arranca con `E2E_TESTING=true`:

```bash
# Local (sin Docker):
cd src/back
E2E_TESTING=true npm run start:dev

# O dentro de Docker (añade E2E_TESTING=true al .env de la raíz y reinicia):
docker compose up -d --build backend
```

> ⚠️ **Nunca** establezcas `E2E_TESTING=true` en producción. El back tiene una doble guarda: si `NODE_ENV=production`, ignora el flag y los endpoints devuelven 404.

> ⚠️ El secret `ENV_FILE` que la GitHub Action `deploy.yml` inyecta en producción **no debe** contener `E2E_TESTING=true`. Antes de mergear a `main`, comprueba el contenido del secret en GitHub.

### 2. Ejecutar el seed inicial

Desde `src/back/`, con la DB arrancada:

```bash
cd src/back
npx prisma db seed
```

El seed es idempotente (usa `upsert`), así que se puede correr varias veces sin error.

### 3. Usuarios disponibles

| Username | Role | Vínculo | Password |
|---|---|---|---|
| `e2e_coach` | COACH | — | `E2eP@ss123!` |
| `e2e_client_linked` | CLIENT | `coachId = e2e_coach.id` | `E2eP@ss123!` |
| `e2e_client_unlinked` | CLIENT | `coachId = null` | `E2eP@ss123!` |

Además, el seed crea: una rutina `e2e_routine_basic` propiedad de `e2e_coach`, una asignación a `e2e_client_linked`, y una invitación pendiente con código `E2E-INVITE-001`.

### 4. Usar las fixtures en un test

```ts
// e2e/tests/mi-flow.spec.ts
import { test, expect } from "../fixtures";

test("coach ve su dashboard", async ({ loginAs }) => {
  const page = await loginAs("coach");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
});
```

- `loginAs(role)` ⇒ `Page` ya autenticada (token + datos en `localStorage`). Roles: `'coach' | 'clientLinked' | 'clientUnlinked'`.
- `freshDb` ⇒ fixture auto-run (`auto: true`) que llama a `resetDatabase()` antes de cada test. Para desactivarla en un bloque concreto, `test.use({ freshDb: false })`.
- `resetDatabase()` ⇒ helper directo si necesitas resetear a mano dentro de un test.

### 5. Convención de prefijo `e2e_*`

`POST /testing/reset` solo borra usuarios cuyo `username` empieza por `e2e_` (y todo lo que cuelga de ellos en cascada). Si tu test crea datos extra a mano, **respeta el prefijo** (`e2e_extra_user`, `e2e_routine_xyz`) para que el reset los limpie.

### 6. Reset / login manual desde la línea de comandos

```bash
# Reset completo (borra e2e_*, vuelve a sembrar)
curl -X POST http://localhost:3000/testing/reset

# Login as coach (devuelve { access_token, user })
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"e2e_coach"}' \
  http://localhost:3000/testing/login

# Username no permitido (HTTP 400)
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin"}' \
  http://localhost:3000/testing/login
```

> En dev local el back vive en `:3000` directamente (sin `/api`). El prefijo `/api` solo lo añade Nginx en producción.

---

## Tests de Autenticación (LW-441)

Los tests de autenticación cubren el flujo completo de registro, inicio de sesión, cierre de sesión y persistencia.

### Qué cubren:
- **Login**: Éxito como COACH y CLIENT, errores por credenciales incorrectas o usuario inexistente.
- **Registre**: Creación de nuevos usuarios con rol dinámico, validación de errores (usuario duplicado, contraseñas no coincidentes).
- **Logout**: Cierre de sesión correcto y limpieza de `localStorage`.
- **Persistència**: Verificación de que la sesión se mantiene tras recargar la página.

### Ejecución:

Para ejecutar exclusivamente los tests de autenticación:

```bash
cd e2e
npx playwright test tests/auth.spec.ts
```

Para ver la ejecución en tiempo real (modo UI):
```bash
npx playwright test tests/auth.spec.ts --ui
```

Si se quiere hacer todos los test en conjunto, hay que añadir --workers=1:
```bash
npx playwright test --workers=1
```

### Page Objects
Se han introducido Page Objects para mejorar la mantenibilidad:
- `LoginPage`: `/e2e/fixtures/pages/LoginPage.ts`
- `RegisterPage`: `/e2e/fixtures/pages/RegisterPage.ts`

Uso en tests:
```ts
test('ejemplo login', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login('usuario', 'password');
  await expect(page).toHaveURL(/\/dashboard/);
});
```

---

> La guía completa de debugging y Page Objects avanzados llegará con **LW-446**.
