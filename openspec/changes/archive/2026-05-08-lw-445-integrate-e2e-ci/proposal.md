## Por qué

La suite E2E (Playwright) existe y cubre los flujos críticos en local, pero nunca se ejecuta automáticamente en los pull requests. Sin ejecución en CI, las regresiones pueden colarse en `main` sin detectarse — exactamente el riesgo que la épica de testing (LW-436) fue creada para eliminar.

## Qué cambia

- Añadir un workflow de GitHub Actions (o extender el existente) que ejecute `npm run test:e2e:browser` en cada PR que apunte a `main`.
- El job arranca el stack completo (PostgreSQL + NestJS backend + Vite frontend) dentro del runner, con `E2E_TESTING=true` para que el harness de testing esté activo.
- En caso de fallo, se suben artefactos de Playwright (trace, captura de pantalla y vídeo) asociados al run del workflow para depuración post-mortem.
- El merge a `main` queda bloqueado si algún test E2E falla (regla de branch protection sobre el check `e2e-ci`).
- Se actualizan `e2e/.env.example` y `src/back/.env.example` para documentar las nuevas variables requeridas en CI (`PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_API_URL`).

## Capacidades

### Nuevas capacidades

- `e2e-ci`: Ejecución automatizada de la suite Playwright E2E en GitHub Actions en cada PR, con el stack completo levantado, el flag `E2E_TESTING` activo y subida de artefactos en caso de fallo.

### Capacidades modificadas

- `e2e-testing`: La spec existente gana un nuevo requisito de ejecución en CI — la suite DEBE ejecutarse y pasar en GitHub Actions en cada PR que apunte a `main`, con artefactos subidos en caso de fallo. Los escenarios existentes no cambian; se añade un nuevo bloque de escenarios.

## Impacto

- **CI/CD**: Nuevo archivo de workflow de GitHub Actions `.github/workflows/e2e.yml` (separado de `deploy.yml` para mantener las responsabilidades aisladas). Requiere `docker compose` disponible en el runner (ubuntu-latest ya lo incluye).
- **Secrets / variables de entorno**: No se requieren nuevos secrets — el runner usa una PostgreSQL efímera en proceso. `DATABASE_URL`, `JWT_SECRET` y `FRONTEND_URL` se inyectan como variables de entorno del workflow con valores seguros para tests (no son secrets de producción).
- **Branch protection**: Hay que activar una regla de branch protection en `main` para el check `e2e-ci` — es una configuración del repositorio de GitHub, no un cambio de código, pero forma parte de los criterios de aceptación.
- **`e2e/.env.example`**: Añadir documentación de `PLAYWRIGHT_API_URL` (valor por defecto `http://localhost:3000/api`).
- **Sin cambios en backend ni frontend** — el módulo de testing y los fixtures ya están en su lugar desde LW-438/LW-440.
- **Nota de testing**: El propio job de CI es el harness de testing; no se añaden tests unitarios adicionales. Cualquier test inestable (flaky) que se descubra durante la integración en CI debe corregirse antes de cerrar este ticket.

> Jira: LW-445 · Epic: LW-436 (Implementación de estrategia de testing E2E + unitarios)
