## Contexto

El backend `progress-api` (LW-258) ya expone dos endpoints con alcance CLIENT:
- `GET /progress/client/sessions` → `{ sessions: [{ id, routineName, completedAt, completionPercentage }] }`
- `GET /progress/client/stats` → `{ totalSessions, totalSets, totalExercises }`

La feature `client` (`src/front/src/features/client/`) actualmente tiene dos páginas: `ClientDashboard` (lista de rutinas + chat) y `ClientMyCoach` (gestión de invitaciones del entrenador). No existe ninguna página que muestre el historial de entrenamiento ni estadísticas agregadas. La navegación del cliente está basada en rutas y registrada en `App.tsx` con `ProtectedRoute requiredRole="CLIENT"`.

El proyecto usa la instancia compartida de axios en `shared/utils/api.ts` con interceptor JWT bearer — no es necesario construir la cabecera `Authorization` manualmente (a diferencia del patrón antiguo de `myCoachService.ts`).

## Objetivos / No objetivos

**Objetivos:**
- Añadir la página `ClientHistoryStats.tsx` en la feature `client` con tabla de historial de sesiones y contadores de estadísticas.
- Añadir `progressService.ts` en `src/front/src/features/client/services/` que encapsula ambas llamadas a la API de progreso.
- Registrar la ruta `/client/history` en `App.tsx` protegida por el rol `CLIENT`.
- Añadir una entrada de navegación (botón/enlace) en `ClientDashboard.tsx` para acceder a la nueva página.
- Añadir claves i18n para los textos de la nueva página en `ca.json`, `es.json` y `en.json`.

**No objetivos:**
- Sin gráficos.
- Sin paginación en la UI — la API devuelve la lista completa y se renderiza entera.
- Sin cambios en el backend.
- Sin implementación específica para móvil.
- Sin configuración de harness Vitest (sin tests frontend automatizados; solo QA manual).

## Decisiones

### Decisión 1: Usar la instancia compartida de axios, no axios directo con cabecera de autenticación manual

`myCoachService.ts` construye manualmente las cabeceras `Authorization: Bearer <token>` e importa `axios` directamente. La utilidad compartida en `shared/utils/api.ts` ya adjunta el JWT y gestiona los redireccionamientos por 401.

**Elegido:** Importar `api` desde `@/shared/utils/api` en el nuevo `progressService.ts`.  
**Alternativa descartada:** Copiar el patrón raw de axios de `myCoachService.ts`. El enfoque basado en interceptores es más mantenible y consistente con el resto del código base.

### Decisión 2: La página de Historial como ruta independiente, no como pestaña dentro de ClientDashboard

`ClientDashboard` ya es complejo (lista de rutinas, polling, overlay de chat, modales de confirmación). Añadir una pestaña in-page aumentaría el acoplamiento y el tamaño del componente sin ningún beneficio.

**Elegido:** `/client/history` como ruta independiente con su propio componente de página y botón `navigate` en el área de cabecera del dashboard.  
**Alternativa descartada:** Pestaña in-page dentro de `ClientDashboard`. Aumenta el tamaño del archivo y mezcla responsabilidades no relacionadas.

### Decisión 3: Sin estado de carga separado para las stats — una sola petición con flag de carga combinado

Tanto `GET /progress/client/sessions` como `GET /progress/client/stats` se llaman al montar. Un único booleano `loading` cubre ambos; se lanzan en paralelo con `Promise.all`.

**Elegido:** `Promise.all([getClientSessions(), getClientStats()])` al montar, estado `loading` único.  
**Alternativa descartada:** Peticiones secuenciales o estados de carga separados por sección — innecesario para esta página simple de solo lectura.

### Decisión 4: Visualización de completionPercentage

Las sesiones anteriores a LW-258 pueden tener `completionPercentage = null`. Se muestran como `—` en la tabla para evitar mostrar `0%` para sesiones completadas antes de que existiera el campo.

## Riesgos / Compromisos

- [Riesgo: la API devuelve una lista de sesiones muy larga] → El backend no tiene paginación en `GET /progress/client/sessions`. Para clientes con muchas sesiones, la tabla podría ser muy larga. Mitigación: aceptable para el MVP; se puede añadir un parámetro `limit` más adelante. La página renderiza todas las filas sin virtualización.
- [Riesgo: `completedAt` null en sesiones antiguas] → Las sesiones completadas antes de añadir `completedAt` mostrarán fecha vacía. Mitigación: mostrar `—` como fallback en la celda de fecha.
- [Riesgo: inconsistencia entre `shared/utils/api.ts` y el patrón raw de axios] → El código nuevo usa la instancia compartida; el `myCoachService.ts` existente usa axios directo. Compromiso aceptado para no romper código que funciona; una refactorización más amplia es una tarea separada.

## Plan de despliegue

1. Añadir `progressService.ts` — adición pura, sin modificar código existente.
2. Añadir `ClientHistoryStats.tsx` — adición pura.
3. Registrar la ruta en `App.tsx` — una línea adicional.
4. Añadir enlace de navegación en `ClientDashboard.tsx` — cambio mínimo (un botón/enlace en el área de cabecera).
5. Añadir claves i18n a los tres archivos de localización — solo adiciones, sin tocar claves existentes.
6. Sin migraciones de base de datos. Sin cambios en el backend. Sin eventos Socket.IO. Sin cambios en Docker/Nginx.

Rollback: revertir los cuatro cambios de archivos anteriores. No se persiste ningún estado en el cliente; no hay migraciones que deshacer.

## Preguntas abiertas

- Ninguna que bloquee la implementación. Para el futuro: si añadir un filtro por rango de fechas o un parámetro `limit` en el backend se deja para post-MVP.
