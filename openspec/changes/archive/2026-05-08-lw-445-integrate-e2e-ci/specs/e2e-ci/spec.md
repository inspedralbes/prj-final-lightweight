# Spec: Integración E2E en CI

## Propósito

Automatizar la ejecución de la suite Playwright E2E en GitHub Actions en cada pull request que apunte a `main`, usando un entorno efímero con el stack completo (PostgreSQL + NestJS backend + Vite frontend) levantado de forma nativa dentro del runner. Los runs fallidos DEBEN subir artefactos de Playwright (trace, captura de pantalla, vídeo) para la depuración post-mortem. El merge a `main` queda bloqueado hasta que el check de estado `e2e / playwright` pase.

---

## Requisitos AÑADIDOS

### Requisito: Workflow de CI E2E en GitHub Actions

El repositorio DEBE incluir un workflow de GitHub Actions en `.github/workflows/e2e.yml` que se dispare en cada evento `pull_request` que apunte a `main` (y opcionalmente en `workflow_dispatch`). El workflow DEBE ejecutar un único job llamado `playwright` que: arranque un service container de PostgreSQL 17; instale Node 20 y todas las dependencias de los workspaces (back, front, e2e) con caché de npm activada; construya el backend NestJS; arranque el proceso del backend con `E2E_TESTING=true` y `NODE_ENV=test` y espere a que esté disponible en el puerto 3000; arranque el frontend Vite en modo preview o dev y espere al puerto 5173; ejecute `cd e2e && npx playwright test`; y suba artefactos en caso de fallo.

#### Escenario: El workflow se dispara en un PR a main

- **DADO** un PR abierto contra `main` con cambios en el código
- **CUANDO** se crea o actualiza el PR
- **ENTONCES** el workflow `e2e.yml` se dispara automáticamente
- **Y** el job `playwright` aparece como check pendiente en el PR

#### Escenario: La suite completa pasa en verde

- **DADO** que todos los tests E2E pasan con el stack arrancado en el runner
- **CUANDO** el job `playwright` termina
- **ENTONCES** el check `e2e / playwright` queda en estado `success`
- **Y** el PR puede mergearse (si el resto de checks también pasan)
- **Y** no se suben artefactos (solo se suben en fallo)

#### Escenario: La suite falla y bloquea el merge

- **DADO** que al menos un test E2E falla durante la ejecución del job
- **CUANDO** el job `playwright` termina con código distinto de 0
- **ENTONCES** el check `e2e / playwright` queda en estado `failure`
- **Y** el PR no puede mergearse mientras el check esté en `failure`
- **Y** se suben los artefactos `e2e/test-results/` y `e2e/playwright-report/` al artefacto `e2e-report-<run_id>`

#### Escenario: El workflow se puede disparar manualmente

- **DADO** un desarrollador con permisos de `write` en el repositorio
- **CUANDO** accede a Actions → e2e.yml → Run workflow
- **ENTONCES** el job se dispara con los mismos pasos que en un PR
- **Y** los resultados son visibles en la pestaña de Actions

---

### Requisito: Stack efímero con service container de PostgreSQL

El workflow DEBE usar un service container de GitHub Actions para PostgreSQL 17 (`image: postgres:17`) con health-check (`pg_isready`) para que el backend solo arranque una vez que la base de datos esté lista. La base de datos DEBE llamarse `lw_e2e`, el usuario `postgres` y la contraseña `postgres`. La `DATABASE_URL` inyectada en el backend DEBE ser `postgresql://postgres:postgres@localhost:5432/lw_e2e`.

#### Escenario: El backend arranca con la DB lista

- **DADO** que el service container de PostgreSQL ha superado su health-check
- **CUANDO** se ejecuta el step de build e inicio del backend
- **ENTONCES** `npm run start:prod` (o equivalente) arranca sin errores de conexión a la DB
- **Y** Prisma completa las migraciones automáticamente (`prisma migrate deploy`)
- **Y** el seed inicial se aplica vía `npx prisma db seed`

#### Escenario: El backend no arranca sin DB

- **DADO** que el service container de PostgreSQL no está listo (p.ej. health-check fallando)
- **CUANDO** el step intenta arrancar el backend
- **ENTONCES** el step falla con un error de conexión a PostgreSQL
- **Y** el job termina con `failure` antes de intentar ejecutar Playwright

#### Escenario: La DB es efímera — no persiste entre runs

- **DADO** un run anterior que dejó datos en la DB del runner
- **CUANDO** comienza un nuevo run del workflow
- **ENTONCES** el service container de PostgreSQL se inicia con una DB vacía
- **Y** el seed se aplica desde cero al arrancar el backend

---

### Requisito: Credenciales de prueba hardcodeadas en el workflow (no en secrets)

El workflow DEBE inyectar `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `VITE_BACK_URL`, `E2E_TESTING` y `NODE_ENV` como variables `env:` directamente en el YAML, usando valores seguros y no productivos. No se DEBEN requerir nuevos secrets de GitHub Actions para ejecutar E2E en CI.

#### Escenario: El workflow es ejecutable sin configurar secrets adicionales

- **DADO** un fork del repositorio sin ningún secret configurado
- **CUANDO** se abre un PR en el fork (o se dispara manualmente el workflow)
- **ENTONCES** el job `playwright` arranca y usa las credenciales hardcodeadas del YAML
- **Y** no falla por `Secret not found` ni por variables de entorno faltantes

#### Escenario: Las credenciales de CI no son reutilizables en producción

- **DADO** el archivo `.github/workflows/e2e.yml` inspeccionado por un auditor
- **CUANDO** se revisan los valores de `JWT_SECRET` y `DATABASE_URL`
- **ENTONCES** los valores están claramente etiquetados con un comentario `# Solo CI — nunca usar en producción`
- **Y** el valor de `JWT_SECRET` es distinto del que usa el secret `ENV_FILE` de producción

---

### Requisito: Caché de dependencias npm y browsers de Playwright

El workflow DEBE cachear `node_modules` de cada workspace (`src/back`, `src/front`, `e2e`) con clave basada en el hash del `package-lock.json` correspondiente, y DEBE cachear los binarios de browsers de Playwright en `~/.cache/ms-playwright` con clave basada en `e2e/package-lock.json`. Un MISS de caché DEBE seguir resultando en un run exitoso (fallback a instalación nueva).

#### Escenario: Un cache hit acelera el job

- **DADO** un run previo que calentó la caché con las mismas versiones de dependencias
- **CUANDO** se ejecuta el job con el mismo `package-lock.json`
- **ENTONCES** el step `Cache node_modules` reporta `Cache hit`
- **Y** el step `Cache Playwright browsers` reporta `Cache hit`
- **Y** el tiempo total del job es inferior a 4 minutos (frente a ~8 min en frío)

#### Escenario: Un cache miss no rompe el job

- **DADO** un cambio en `e2e/package-lock.json` (p.ej. bump de `@playwright/test`)
- **CUANDO** el job se ejecuta por primera vez con la nueva versión
- **ENTONCES** el step `Cache Playwright browsers` reporta `Cache miss`
- **Y** los browsers se descargan e instalan correctamente
- **Y** el job termina con éxito (o falla por razón de los tests, no del setup)

---

### Requisito: Artefactos de depuración subidos en caso de fallo

El workflow DEBE subir `e2e/test-results/` y `e2e/playwright-report/` como un único artefacto de GitHub Actions llamado `e2e-report-${{ github.run_id }}` con retención de 7 días cuando el step `playwright` falle o se cancele. El step de subida DEBE usar `if: failure()` para que no se ejecute en builds en verde.

#### Escenario: Los artefactos están disponibles tras un fallo

- **DADO** un test E2E que falla y genera trace, captura de pantalla y vídeo
- **CUANDO** el job `playwright` termina con `failure`
- **ENTONCES** el step `Upload Playwright report` se ejecuta
- **Y** el artefacto `e2e-report-<run_id>` aparece en la pestaña Summary del run
- **Y** el artefacto contiene `playwright-report/index.html` con los detalles del fallo
- **Y** el artefacto contiene los archivos `trace.zip`, `.png` y `.webm` del test fallido

#### Escenario: Los artefactos no se suben en un run verde

- **DADO** que todos los tests E2E pasan
- **CUANDO** el job `playwright` termina con `success`
- **ENTONCES** el step `Upload Playwright report` se salta (`if: failure()` evalúa a false)
- **Y** no aparece ningún artefacto en la pestaña Summary del run

#### Escenario: Los artefactos expiran tras 7 días

- **DADO** un artefacto `e2e-report-<run_id>` subido hace más de 7 días
- **CUANDO** se accede al run en la UI de GitHub
- **ENTONCES** el artefacto ya no está disponible para descarga
- **Y** el run muestra `Artifact expired` o equivalente

---

### Requisito: Espera activa (readiness check) antes de lanzar Playwright

El workflow DEBE esperar a que tanto el backend (puerto 3000) como el frontend (puerto 5173) sean alcanzables antes de ejecutar Playwright, usando un bucle de reintentos (`curl --retry 30 --retry-delay 2 --retry-connrefused`) o equivalente. Si alguno de los servicios no responde en 60 segundos, el step DEBE fallar con un mensaje de error explícito.

#### Escenario: El backend está listo antes de que Playwright arranque

- **DADO** que el backend tarda 15 segundos en compilar y arrancar
- **CUANDO** el step de readiness-check ejecuta el bucle de reintentos
- **ENTONCES** el step espera hasta que `GET http://localhost:3000/api` responde con cualquier código HTTP
- **Y** solo entonces comienza el step siguiente (`npx playwright test`)

#### Escenario: El backend no responde — el job falla rápido

- **DADO** un error en el paso de build del backend que impide su arranque
- **CUANDO** el step de readiness-check espera 60 segundos sin respuesta
- **ENTONCES** el step falla con el mensaje `"El backend no estuvo listo en el puerto 3000 en 60s"`
- **Y** el job termina con `failure` sin haber ejecutado ningún test

---

### Requisito: `PLAYWRIGHT_API_URL` documentado en `e2e/.env.example`

El archivo `e2e/.env.example` DEBE incluir la variable `PLAYWRIGHT_API_URL` con el valor por defecto `http://localhost:3000/api` y un comentario en línea explicando su propósito. Esta variable ya es consumida por `e2e/global-setup.ts`.

#### Escenario: La variable está documentada en .env.example

- **DADO** `e2e/.env.example` en el repositorio
- **CUANDO** un desarrollador lo abre
- **ENTONCES** encuentra la línea `PLAYWRIGHT_API_URL=http://localhost:3000/api` con un comentario explicativo
- **Y** la documentación es coherente con el uso en `e2e/global-setup.ts`

---

### Requisito: Branch protection activa en `main` para el check E2E

El repositorio DEBE tener una regla de branch protection en `main` que exija que el check de estado `e2e / playwright` pase antes de que cualquier PR pueda mergearse. Este es un cambio en la configuración del repositorio de GitHub, no un cambio de código, pero forma parte de la Definición de Hecho para LW-445.

#### Escenario: El merge queda bloqueado si el check falla

- **DADO** la branch protection activada en `main`
- **Y** un PR cuyo check `e2e / playwright` está en estado `failure`
- **CUANDO** un desarrollador intenta mergear el PR
- **ENTONCES** GitHub bloquea el merge con el mensaje `"Required status check 'e2e / playwright' has not passed"`

#### Escenario: El merge se permite si el check pasa

- **DADO** la branch protection activada en `main`
- **Y** un PR cuyo check `e2e / playwright` está en estado `success`
- **CUANDO** un desarrollador con permisos intenta mergear el PR
- **ENTONCES** el merge se permite (asumiendo que el resto de checks requeridos también pasan)
