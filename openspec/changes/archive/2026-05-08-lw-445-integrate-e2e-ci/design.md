## Contexto

La suite Playwright E2E vive en `e2e/` y cubre los flujos críticos del proyecto (auth, rutinas, FriendSession/VirtualGymRoom, invitaciones, notificaciones). Todos los tests pasan en local cuando el stack completo está corriendo con `E2E_TESTING=true`. El workflow de CI existente (`.github/workflows/deploy.yml`) solo gestiona el despliegue a producción en push a `main` — hoy no existe ninguna puerta de calidad pre-merge.

El harness de testing ya proporciona:
- `POST /api/testing/reset` — limpia y re-seedea los datos `e2e_*`
- `POST /api/testing/login` — emite JWTs para usuarios de prueba sin credenciales reales
- `e2e/fixtures/` — fixtures de Playwright para `loginAs`, `freshDb` y `twoUsers`
- `e2e/global-setup.ts` — valida que el backend es alcanzable antes de que la suite arranque

La única pieza que falta es un workflow de GitHub Actions que levante este stack en cada PR.

## Objetivos / No objetivos

**Objetivos:**
- Ejecutar la suite Playwright E2E completa en cada PR que apunte a `main`, bloqueando el merge en caso de fallo.
- Levantar el stack completo (PostgreSQL 17 + NestJS backend + Vite frontend) de forma nativa dentro del runner — sin servidor externo.
- Subir artefactos de Playwright (trace, captura de pantalla y vídeo) cuando los tests fallen.
- Mantener el nuevo workflow aislado de `deploy.yml` (archivo separado, responsabilidades separadas).
- Documentar las variables de entorno efímeras necesarias para que el workflow sea autocontenido y auditable.

**No objetivos:**
- Ejecutar tests E2E en un entorno de staging/preview (eso pertenece a un cambio de infraestructura futuro).
- Añadir nuevos escenarios de test — el contenido de la suite es responsabilidad de LW-441–444.
- Configurar HTTPS para el runner de CI (Playwright usa `http://localhost` sin `getUserMedia`, por lo que los tests de videollamada WebRTC quedan fuera del alcance de CI hasta que se añada un túnel HTTPS).
- Paralelizar la suite en múltiples shards (un solo worker es suficiente para el número actual de tests).
- Integrar los resultados E2E con Jira o una herramienta de gestión de tests.

## Decisiones

### Decisión 1: Archivo de workflow separado (`.github/workflows/e2e.yml`)

**Elegido:** Nuevo archivo `e2e.yml`, disparado en `pull_request` a `main` (y opcionalmente en `workflow_dispatch` para ejecuciones manuales).

**Alternativa considerada:** Extender `deploy.yml` con un job adicional.

**Justificación:** `deploy.yml` se ejecuta en `push` a `main` (post-merge); añadir una puerta pre-merge ahí requeriría refactorizar su trigger y acoplar testing a despliegue. Un archivo separado mantiene las responsabilidades aisladas, permite que cada workflow falle de forma independiente y facilita añadir otros triggers (p.ej. `schedule`) en el futuro.

### Decisión 2: Arrancar servicios de forma nativa (no con Docker Compose)

**Elegido:** Instalar Node 20, ejecutar `npm install` para cada workspace, arrancar el backend con `node dist/main.js` y el frontend con `vite preview` (o `vite dev`) como procesos en segundo plano, y usar un service container de PostgreSQL gestionado por GitHub (`services.postgres`).

**Alternativa considerada:** Usar el `docker-compose.yml` existente dentro del runner.

**Justificación:** Los runners `ubuntu-latest` tienen Docker, pero construir todas las imágenes desde cero en cada PR añade 3–5 minutos y consume espacio de caché significativo. Arrancar los servicios de forma nativa es más rápido (~90 s) y más eficiente con la caché (las cachés de npm y de browsers de Playwright son fáciles de keying). El enfoque de service container para Postgres es idiomático en GitHub Actions y evita la complejidad de contenedor-en-contenedor.

### Decisión 3: Credenciales de prueba efímeras hardcodeadas en el workflow (no en secrets)

**Elegido:** `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` y `VITE_BACK_URL` se definen como `env:` en el YAML del workflow con valores claramente de prueba (p.ej. `JWT_SECRET: e2e-test-secret-not-for-production`).

**Alternativa considerada:** Leerlos desde secrets de GitHub Actions (como hace `ENV_FILE` para producción).

**Justificación:** Son valores efímeros, de un solo uso, sin acceso a datos de producción. Ponerlos en secrets añade fricción (los nuevos miembros del equipo necesitan que se les conceda acceso) y oscurece el comportamiento del workflow. Los valores de prueba hardcodeados hacen el workflow auditable y autodocumentado. Un comentario en el YAML deja clara la intención.

### Decisión 4: Caché de browsers de Playwright con `actions/cache`

**Elegido:** Cachear `~/.cache/ms-playwright` con clave `playwright-browsers-${{ hashFiles('e2e/package-lock.json') }}`.

**Justificación:** Los binarios de browsers de Playwright pesan ~300 MB. Sin caché, cada ejecución los re-descarga. La clave de caché se invalida cuando `e2e/package-lock.json` cambia (es decir, cuando se actualiza la versión de Playwright), que es el punto de invalidación correcto.

### Decisión 5: Subida de artefactos con `actions/upload-artifact`

**Elegido:** Subir `e2e/test-results/` (traces, screenshots, vídeos) y `e2e/playwright-report/` en caso de fallo (`if: failure()`).

**Justificación:** Son los directorios de salida estándar de Playwright. Subirlos como un único artefacto llamado `e2e-report-${{ github.run_id }}` facilita encontrarlos en la UI de GitHub Actions. La retención se fija en 7 días (valor por defecto) — suficiente para depurar antes de que el PR se cierre.

## Riesgos / Compromisos

| Riesgo | Mitigación |
|--------|------------|
| **Tests inestables (flaky) inflan el tiempo de CI** — los tests de sockets multi-usuario pueden ser sensibles al timing. | `playwright.config.ts` ya configura `retries: 2` en CI. Cualquier test que falle 3 veces seguidas tras mergear este cambio debe triarse inmediatamente. |
| **Condición de carrera en el arranque de servicios** — el backend puede no estar listo cuando el `global-setup.ts` de Playwright llama a `/api/testing/reset`. | Añadir un bucle de `wait-on` o `curl --retry` antes de ejecutar Playwright. El `global-setup.ts` ya lanza un error claro si el backend no es alcanzable, por lo que el fallo es diagnosticable. |
| **Binding de puertos del service container de PostgreSQL** — los service containers de GitHub mapean puertos de forma diferente a Docker Compose local. | Usar `services.postgres.ports: ['5432:5432']` y definir `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lw_e2e`. El `src/back/.env` del backend es irrelevante en CI (las variables de entorno se inyectan directamente). |
| **Tiempo de build** — `npm install` × 3 workspaces + build de Nest + build de Vite podría llevar el job por encima de 10 minutos. | Cachear `node_modules` de cada workspace por separado, con clave basada en el `package-lock.json` correspondiente. Objetivo: job completo en < 8 minutos tras el calentamiento de caché. |
| **Los tests de WebRTC no pueden ejecutarse en CI sin HTTPS** — `getUserMedia` está bloqueado en `http://`. | Los tests E2E de videollamada existentes (si los hay) deben marcarse con `@no-ci` y omitirse con `--grep-invert @no-ci` hasta que se añada un certificado autofirmado o un túnel. |

## Plan de despliegue

1. Añadir `.github/workflows/e2e.yml` (archivo nuevo — sin riesgo para los workflows existentes).
2. Verificar que el workflow pasa en verde en un PR de prueba antes de activar la regla de branch protection.
3. Activar la branch protection en `main`: exigir que el check `e2e / playwright` pase antes de mergear.
4. Actualizar `e2e/.env.example` para documentar `PLAYWRIGHT_API_URL`.

**Rollback:** Desactivar la regla de branch protection y eliminar `e2e.yml`. Sin cambios de código en backend ni frontend.

## Preguntas abiertas

- **¿Debe `e2e.yml` ejecutarse también en `push` a `main`** (post-merge, además de en PRs pre-merge)? Esto daría una señal si la suite se rompe tras un push directo, pero duplicaría el uso del runner. Por defecto: no — los PRs son la puerta; los runs post-merge en main los gestiona el smoke check de `deploy.yml`.
- **Integración de Vitest en CI (LW-452):** Ese ticket está En Progreso en paralelo. ¿Debe `e2e.yml` también ejecutar los tests unitarios, o LW-452 añade su propio `unit.yml`? Recomendación: archivos separados para responsabilidades separadas — LW-452 añade `unit.yml`, este ticket se centra solo en E2E.
