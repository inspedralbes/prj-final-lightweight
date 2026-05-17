## 1. Preparación del entorno local

- [x] 1.1 Verificar que `e2e/global-setup.ts` usa `process.env.PLAYWRIGHT_API_URL` (ya implementado, sólo confirmar)
- [x] 1.2 Añadir `PLAYWRIGHT_API_URL=http://localhost:3000/api` a `e2e/.env.example` con comentario explicativo
- [x] 1.3 Verificar que `playwright.config.ts` aplica `retries: process.env.CI ? 2 : 0` (ya implementado, sólo confirmar)
- [x] 1.4 Revisar si existe algún test marcado con `@no-ci` o si hay tests de video-call que requieran HTTPS — no hay tests de videollamada, ningún tag necesario

## 2. Workflow de GitHub Actions

- [x] 2.1 Crear `.github/workflows/e2e.yml` con trigger `pull_request` (branches: [main]) y `workflow_dispatch`
- [x] 2.2 Añadir el service container de PostgreSQL 17 con health-check (`pg_isready`) y mapeo de puerto `5432:5432`
- [x] 2.3 Añadir step `Setup Node 20` usando `actions/setup-node@v4` con `node-version: '20'`
- [x] 2.4 Añadir steps de caché para `node_modules` de cada workspace (`src/back`, `src/front`, `e2e`) keyed por su `package-lock.json`
- [x] 2.5 Añadir step de caché para Playwright browsers (`~/.cache/ms-playwright`) keyed por `e2e/package-lock.json`
- [x] 2.6 Añadir steps de instalación (`npm ci`) para `src/back`, `src/front` y `e2e` en paralelo donde sea posible
- [x] 2.7 Añadir step `Install Playwright browsers`: `cd e2e && npx playwright install chromium --with-deps`
- [x] 2.8 Añadir step `Build backend`: `cd src/back && npm run build`
- [x] 2.9 Añadir step de arranque del backend en segundo plano con todas las variables de entorno necesarias; migraciones y seed antes de arrancar
- [x] 2.10 Añadir step `Build frontend`: `cd src/front && npm run build`
- [x] 2.11 Añadir step de arranque del frontend en segundo plano con `npm run preview -- --host 0.0.0.0 --port 5173`
- [x] 2.12 Añadir step de readiness-check con `timeout 60 bash -c` para backend (puerto 3000) y frontend (puerto 5173)
- [x] 2.13 Añadir step `Run Playwright tests`: `npx playwright test` con `PLAYWRIGHT_BASE_URL` y `PLAYWRIGHT_API_URL`
- [x] 2.14 Añadir step `Upload Playwright report` con `if: failure()`, artefacto `e2e-report-${{ github.run_id }}`, retención 7 días

## 3. Variables de entorno en el workflow

- [x] 3.1 Definir todas las variables de CI como `env:` directamente en el YAML (no en secrets) con comentarios `# CI only — never use in production`
- [x] 3.2 Valores a usar: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lw_e2e`, `JWT_SECRET=e2e-ci-test-secret`, `FRONTEND_URL=http://localhost:5173`, `VITE_BACK_URL=http://localhost:3000`, `E2E_TESTING=true`, `NODE_ENV=test`

## 4. Branch protection en GitHub

- [ ] 4.1 Una vez el workflow pasa en verde en un PR de prueba, activar la branch protection rule en `main`: "Require status checks to pass before merging" → añadir el check `e2e / playwright`
- [ ] 4.2 Verificar que el merge queda bloqueado en un PR con el check en `failure`

## 5. Tests / Verificación

- [ ] 5.1 Abrir un PR de prueba que no rompa ningún test — verificar que el check `e2e / playwright` pasa y aparece en verde en el PR
- [ ] 5.2 Introducir un fallo intencional en un test E2E en una rama auxiliar — verificar que el check falla, el merge queda bloqueado y los artefactos se suben correctamente
- [ ] 5.3 Descargar el artefacto `e2e-report-<run_id>` del run fallido y abrirlo con `npx playwright show-report` para confirmar que las trazas son navegables
- [ ] 5.4 Confirmar que el job completo (cache warm) tarda menos de 8 minutos en el runner `ubuntu-latest`
- [ ] 5.5 Ejecutar `npm run lint && npm run build` en `src/back` y `src/front` para confirmar que no hay errores introducidos por este cambio
- [x] 5.6 Añadir una entrada en `doc/Proves_usuari.md` documentando cómo interpretar los resultados del check E2E en un PR y cómo acceder a los artefactos en caso de fallo
