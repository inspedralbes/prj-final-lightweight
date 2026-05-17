## 1. Preparación — revisar la infraestructura existente

- [x] 1.1 Leer `e2e/fixtures/index.ts`, `e2e/fixtures/auth.ts`, `e2e/fixtures/users.ts` y `e2e/fixtures/reset.ts` para confirmar la API de fixtures (loginViaApi, freshDb, LoginPage, twoContexts)
- [x] 1.2 Leer `e2e/playwright.config.ts` para confirmar baseURL, apiURL y la configuración `workers: 1`
- [x] 1.3 Leer `e2e/tests/auth.spec.ts` como referencia para la estructura del archivo de tests y estilo de importaciones

## 2. Crear el archivo de tests E2E

- [x] 2.1 Crear `e2e/tests/single-session.spec.ts` con el bloque `describe`, el fixture `freshDb` y los 5 casos de prueba como stubs `test(...)`
- [x] 2.2 Implementar TC-01: login vía `LoginPage`, verificar redirección al dashboard y JWT en `localStorage`
- [x] 2.3 Implementar TC-02: login vía UI en el contexto 1, luego llamar a `POST /auth/login` vía `request.post` en el contexto 2, verificar HTTP 409 y el mensaje `"Session already active"`
- [x] 2.4 Implementar TC-02b (ruta UI): abrir una segunda página `browser.newContext()`, navegar a `/login`, enviar las mismas credenciales, verificar que el toast/mensaje de error sea visible y la URL se mantenga en `/login`
- [x] 2.5 Implementar TC-03: contexto 1 hace login → contexto 2 recibe 409 → contexto 1 hace clic en logout → contexto 2 reintenta `POST /auth/login` y recibe HTTP 200
- [x] 2.6 Implementar TC-04: contexto 1 hace login → `page.close()` → `waitForTimeout(1500)` → nuevo contexto envía `POST /auth/login`, verificar HTTP 200
- [x] 2.7 Implementar TC-05: capturar JWT de `localStorage` antes del logout → logout → enviar `GET /auth/profile` con token Bearer obsoleto → verificar HTTP 401
- [x] 2.8 Agregar limpieza `afterEach`: llamar a `POST /testing/reset` (o logout explícito vía API) para asegurar que ninguna sesión residual se filtre al siguiente test

## 3. Verificación / QA

- [ ] 3.1 Iniciar el backend con `E2E_TESTING=true` y el frontend en local; ejecutar `npx playwright test single-session --reporter=list` desde `e2e/` y confirmar que los 5 tests pasan
- [ ] 3.2 Ejecutar la suite E2E completa (`npx playwright test`) para confirmar que no hay regresiones en `auth.spec.ts`, `coop-session.spec.ts` y otros tests
- [ ] 3.3 Si TC-04 (beacon logout) es inestable, reemplazar el enfoque `waitForTimeout` con una llamada directa a `POST /auth/logout-beacon?t=<token>` según el fallback documentado en design.md
- [x] 3.4 Agregar una entrada de QA manual en `doc/Proves_usuari.md` describiendo cómo verificar manualmente el comportamiento de sesión única en producción (login en dos navegadores, verificar que el segundo es bloqueado)
