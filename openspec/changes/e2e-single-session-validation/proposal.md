## Por qué

LW-459 implementó la restricción de sesión única en el backend (un JWT activo por usuario almacenado en `activeSessionToken`). LW-460 valida esta restricción de extremo a extremo con Playwright: necesitamos evidencia automatizada de que la política funciona en múltiples contextos de navegador antes de considerar la funcionalidad lista para producción. Esto desbloquea la épica padre LW-436 (estrategia de testing) al agregar cobertura para un flujo de autenticación crítico.

## Qué Cambia

- Nuevo archivo de tests E2E `e2e/tests/single-session.spec.ts` que cubre todos los escenarios de LW-460.
- Cinco casos de prueba que verifican el ciclo de vida completo de sesión única: primer login exitoso, login concurrente rechazado, re-login tras logout, limpieza de sesión tras timeout/cierre de pestaña, y `401` en llamadas API con token invalidado.
- Usa la infraestructura Playwright existente (fixtures, contextos duales de navegador, helpers `/testing/*`) — sin nuevas dependencias de framework.

## Capacidades

### Nuevas Capacidades

- `e2e-single-session`: Suite de tests E2E automatizados que valida la restricción de sesión única por usuario en contextos de navegador independientes usando Playwright.

### Capacidades Modificadas

<!-- No hay cambios en requisitos a nivel de spec — este cambio solo agrega cobertura de tests para el comportamiento de backend ya implementado. -->

## Impacto

- **Módulos backend afectados**: `auth` (el campo `activeSessionToken` y el comportamiento de login/logout siendo validado), `testing` (usando los helpers `/testing/login` y `/testing/reset`).
- **Features frontend afectadas**: `auth` (la página de login y el flujo de token en localStorage ejercitados por los tests).
- **Infraestructura de testing**: agrega un nuevo archivo de tests bajo `e2e/tests/`; no se requieren nuevas dependencias — Playwright y los fixtures de test ya existen.
- **Sin impacto en Socket.IO**: flujos puramente HTTP + navegación de navegador.
- **Sin cambios de esquema**: el campo `activeSessionToken` ya existe en el esquema de Prisma.
- **Jira**: LW-460 (tarea) → LW-436 (épica: Implementació d'estratègia de testing E2E + unitaris).
- **Nota de testing**: este cambio ES la suite de tests automatizados; no se requieren tests unitarios adicionales para el propio archivo de tests.
