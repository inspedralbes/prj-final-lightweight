## ADDED Requirements

### Requirement: La restricción de sesión única se valida de extremo a extremo
El sistema DEBE tener una suite de tests E2E automatizados con Playwright en `e2e/tests/single-session.spec.ts` que ejercite la restricción de sesión única por usuario en contextos de navegador independientes. La suite DEBE cubrir los cinco escenarios de criterios de aceptación de LW-460 usando la infraestructura de tests existente (`freshDb`, `loginViaApi`, `LoginPage`, `/testing/reset`, `/testing/login`).

#### Scenario: Primer login exitoso en un nuevo contexto de navegador
- **GIVEN** la base de datos ha sido reseteada (vía `freshDb`) y no hay sesión activa para `e2e_coach`
- **WHEN** el usuario navega a `/login` y envía credenciales válidas
- **THEN** el backend retorna HTTP 200, un JWT se almacena en `localStorage`, y el usuario es redirigido a su dashboard

#### Scenario: El intento de login concurrente es rechazado cuando ya hay una sesión activa
- **GIVEN** `e2e_coach` ya está logueado (sesión activa con JWT válido en BD)
- **WHEN** un segundo contexto de navegador independiente envía `POST /auth/login` con las mismas credenciales
- **THEN** el backend retorna HTTP 409 con el mensaje `"Session already active"`

#### Scenario: La UI muestra un error en el segundo intento de login
- **GIVEN** `e2e_coach` ya está logueado vía un primer contexto de navegador
- **WHEN** un segundo contexto de navegador navega a `/login` y envía las mismas credenciales mediante el formulario de login
- **THEN** la página de login muestra un error visible (toast o mensaje inline) indicando que la cuenta ya está en uso
- **AND** el usuario permanece en la página `/login` (sin redirección al dashboard)

#### Scenario: El re-login tiene éxito tras el logout explícito de la primera sesión
- **GIVEN** `e2e_coach` tiene una sesión activa en el contexto de navegador 1
- **AND** el intento de login del segundo contexto retorna 409
- **WHEN** el contexto 1 realiza un logout (hace clic en el botón de logout, que llama a `POST /auth/logout`)
- **THEN** `User.activeSessionToken` queda limpiado en la base de datos
- **AND** el contexto 2 puede ahora enviar `POST /auth/login` y recibir HTTP 200

#### Scenario: La sesión queda libre tras el cierre de pestaña que dispara el beacon logout
- **GIVEN** `e2e_coach` está logueado vía una página de Playwright
- **WHEN** la página se cierra (disparando `beforeunload` → `navigator.sendBeacon` → `POST /auth/logout-beacon`)
- **AND** pasan ~1500 ms para que el beacon sea procesado
- **THEN** un nuevo contexto de navegador puede loguearse exitosamente como `e2e_coach` (HTTP 200)

#### Scenario: Tras el logout el nuevo login tiene éxito y el token anterior sigue siendo válido para la API hasta su expiración
- **GIVEN** `e2e_coach` está logueado y el JWT ha sido capturado de `localStorage`
- **WHEN** el usuario cierra sesión (`activeSessionToken` queda a null en la BD)
- **THEN** el JWT anterior sigue siendo criptográficamente válido para llamadas API (devuelve 200) — la invalidación inmediata de tokens no está implementada por diseño
- **AND** un nuevo `POST /auth/login` con las mismas credenciales devuelve HTTP 201 (sin conflicto, `activeSessionToken` era null)
- **AND** el nuevo token es diferente del anterior

### Requirement: La suite de tests es aislada y determinista
Los tests E2E de sesión única DEBEN ser autocontenidos: DEBEN resetear la base de datos antes del bloque de tests y limpiar cualquier sesión residual tras cada caso de prueba para evitar contaminación entre tests.

#### Scenario: La base de datos se resetea antes del bloque describe
- **GIVEN** el test runner de Playwright inicia el archivo `single-session.spec.ts`
- **WHEN** comienza el bloque `describe`
- **THEN** el fixture `freshDb` llama a `POST /testing/reset` y recibe HTTP 200 antes de que se ejecute cualquier test

#### Scenario: Las sesiones residuales se limpian tras cada test
- **GIVEN** un caso de prueba dejó una sesión activa para `e2e_coach` (p.ej., el test agotó el tiempo antes del logout)
- **WHEN** el siguiente caso de prueba comienza
- **THEN** el `POST /testing/reset` (vía `freshDb`) limpia todos los datos de usuario E2E, asegurando un estado limpio

#### Scenario: Los tests se ejecutan secuencialmente con un solo worker
- **GIVEN** `playwright.config.ts` establece `workers: 1`
- **WHEN** la suite de sesión única se ejecuta junto a otros specs E2E
- **THEN** no ocurren condiciones de carrera en la base de datos de tests compartida

### Requirement: Compatibilidad con la infraestructura de tests existente
Los tests de sesión única DEBEN usar solo los fixtures y helpers existentes sin modificarlos. El helper `loginViaApi`, el page object `LoginPage`, y los endpoints `/testing/*` DEBEN usarse tal como están.

#### Scenario: Los contextos de navegador independientes simulan dispositivos separados
- **GIVEN** se crean dos instancias independientes de `browser.newContext()` dentro de un solo test
- **WHEN** cada contexto navega y realiza acciones de login
- **THEN** su `localStorage` y cookies están completamente aislados, simulando correctamente dos sesiones de dispositivo distintas

#### Scenario: Verificabilidad — ejecución de la suite en local
- **GIVEN** el backend está ejecutándose con `E2E_TESTING=true` en `localhost:3000`
- **AND** el frontend está ejecutándose en `localhost:5173`
- **WHEN** el desarrollador ejecuta `npx playwright test single-session` desde el directorio `e2e/`
- **THEN** los 5 tests de criterios de aceptación pasan sin intervención manual
