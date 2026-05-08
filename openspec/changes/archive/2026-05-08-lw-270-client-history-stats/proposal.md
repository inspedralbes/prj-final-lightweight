## Por qué

Los clientes necesitan una vista web dedicada para revisar su progreso de entrenamiento — sesiones completadas y estadísticas acumuladas — para mantenerse motivados y hacer seguimiento de su constancia. La API backend (`progress-api`) ya está en producción (LW-258); este cambio la conecta con una interfaz React en la feature `client`.

## Qué cambia

- Añadir una nueva **página de Historial y Estadísticas** dentro de `src/front/src/features/client/` (`ClientHistoryStats.tsx`) que muestra la lista de sesiones completadas del cliente autenticado y sus estadísticas de entrenamiento agregadas.
- Añadir `progressService.ts` en `src/front/src/features/client/services/` que encapsula `GET /progress/client/sessions` y `GET /progress/client/stats`.
- Registrar la nueva ruta en `App.tsx` (o el grupo de rutas del cliente) para que la página sea accesible en `/client/history`.
- Añadir una entrada de navegación en el dashboard del cliente (`ClientDashboard.tsx`) con enlace a la nueva página.
- Añadir las tres claves de traducción i18n requeridas en `ca.json`, `es.json` y `en.json`.

**No incluye**
- Sin gráficos (la visualización de datos compleja queda fuera de alcance según LW-270).
- Sin implementación específica para móvil.
- Sin nuevos endpoints backend — todos los datos provienen del `progress-api` existente.
- Sin paginación en la UI (el backend devuelve la lista completa; se puede añadir más adelante).

## Capacidades

### Nuevas capacidades
- `client-history-stats`: Página web para el cliente que muestra el historial de sesiones completadas (nombre, fecha, % completado) y estadísticas agregadas (total de sesiones, series y ejercicios).

### Capacidades modificadas
- `client-profile`: Se añade una entrada de navegación en el dashboard del cliente para exponer la nueva página de historial. El comportamiento existente no cambia; solo se añade un enlace.

## Impacto

**Frontend** (feature `client`):
- Archivo nuevo: `src/front/src/features/client/pages/ClientHistoryStats.tsx`
- Archivo nuevo: `src/front/src/features/client/services/progressService.ts`
- Modificado: `src/front/src/features/client/pages/ClientDashboard.tsx` — añadir enlace de navegación
- Modificado: `src/front/src/App.tsx` — añadir ruta protegida para `/client/history` (rol CLIENT)
- Modificado: archivos de localización i18n (`ca.json`, `es.json`, `en.json`) — añadir claves de traducción para la nueva página

**Backend**: Sin cambios. Usa los endpoints existentes de `ProgressController` (`GET /progress/client/sessions`, `GET /progress/client/stats`) del spec `progress-api` (LW-258).

**Nota sobre testing**: El nuevo `progressService.ts` contiene llamadas axios puras. Si en un spec futuro se introduce un harness Vitest, estas funciones serán las primeras candidatas para tests unitarios. Para este cambio, es suficiente con QA manual mediante entradas en doc/Proves_usuari.md.

**Jira**: Tarea LW-270 — Web Cliente: Vista de Historial y Estadísticas (Épica LW-257 — Seguimiento de Progreso y Analytics)
