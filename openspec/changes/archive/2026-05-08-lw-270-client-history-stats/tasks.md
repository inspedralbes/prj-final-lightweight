## 1. Frontend — Servicio de progreso

- [x] 1.1 Crear `src/front/src/features/client/services/progressService.ts` exportando `getClientSessions()` (llama a `GET /progress/client/sessions`) y `getClientStats()` (llama a `GET /progress/client/stats`) usando la instancia compartida `api` de `@/shared/utils/api`
- [x] 1.2 Definir las interfaces TypeScript `ClientSession { id, routineName, completedAt: string | null, completionPercentage: number | null }` y `ClientStats { totalSessions, totalSets, totalExercises }` en el mismo archivo

## 2. Frontend — Página de Historial y Estadísticas

- [x] 2.1 Crear `src/front/src/features/client/pages/ClientHistoryStats.tsx` con un wrapper `Layout`, `LoadingScreen` mientras las dos llamadas a la API están en curso, y una sección de contadores de estadísticas (3 tarjetas para totalSessions / totalSets / totalExercises)
- [x] 2.2 Añadir una tabla/lista de historial de sesiones debajo de las stats: columnas para nombre de rutina, fecha (`completedAt` formateado con `toLocaleDateString()`, o `—` si es null) y % de completado (valor + `%`, o `—` si es null)
- [x] 2.3 Añadir renderizado de estado vacío cuando el array `sessions` esté vacío: mostrar icono + mensaje `t('history.noSessions')`
- [x] 2.4 Gestión de errores: el bloque catch llama a `toast.error(t('messages.errorOccurred'))` cuando falla cualquiera de las llamadas a la API
- [x] 2.5 Añadir un botón/enlace "Volver" (usando `useNavigate` o `<Link to="/client-home">`) en la parte superior de la página para que el cliente pueda volver al dashboard

## 3. Frontend — Enrutamiento

- [x] 3.1 Importar `ClientHistoryStats` en `src/front/src/App.tsx` y añadir `<Route path="/client/history" element={<ProtectedRoute requiredRole="CLIENT"><ClientHistoryStats /></ProtectedRoute>} />` dentro del router junto a las demás rutas CLIENT

## 4. Frontend — Enlace de navegación en el dashboard

- [x] 4.1 En `src/front/src/features/client/pages/ClientDashboard.tsx`, añadir un botón/enlace de navegación en el área de cabecera (junto a la sección de título existente) que llame a `navigate('/client/history')` — con estilo coherente con la paleta naranja/neutra existente; etiquetado con `t('history.navLabel')`

## 5. Frontend — i18n

- [x] 5.1 Añadir las siguientes claves a `src/front/src/i18n/locales/ca.json` bajo el namespace `"history"`:
  ```json
  "history": {
    "navLabel": "Historial i Estadístiques",
    "title": "El meu progrés",
    "totalSessions": "Sessions completades",
    "totalSets": "Sèries completades",
    "totalExercises": "Exercicis completats",
    "noSessions": "Encara no has completat cap sessió d'entrenament.",
    "colRoutine": "Rutina",
    "colDate": "Data",
    "colCompletion": "% Completat"
  }
  ```
- [x] 5.2 Añadir las mismas claves (traducidas al español) a `src/front/src/i18n/locales/es.json`:
  ```json
  "history": {
    "navLabel": "Historial y Estadísticas",
    "title": "Mi progreso",
    "totalSessions": "Sesiones completadas",
    "totalSets": "Series completadas",
    "totalExercises": "Ejercicios completados",
    "noSessions": "Todavía no has completado ninguna sesión de entrenamiento.",
    "colRoutine": "Rutina",
    "colDate": "Fecha",
    "colCompletion": "% Completado"
  }
  ```
- [x] 5.3 Añadir las mismas claves (traducidas al inglés) a `src/front/src/i18n/locales/en.json`:
  ```json
  "history": {
    "navLabel": "History & Stats",
    "title": "My Progress",
    "totalSessions": "Completed sessions",
    "totalSets": "Completed sets",
    "totalExercises": "Completed exercises",
    "noSessions": "You haven't completed any training sessions yet.",
    "colRoutine": "Routine",
    "colDate": "Date",
    "colCompletion": "% Complete"
  }
  ```

## 6. Tests / Verificación

- [x] 6.1 Ejecutar `npm run lint` dentro de `src/front/` — corregir cualquier error de ESLint
- [x] 6.2 Ejecutar `npm run build` dentro de `src/front/` (`tsc -b && vite build`) — confirmar que no hay errores TypeScript
- [x] 6.3 QA manual — pendent verificació en navegador — arrancar el entorno de desarrollo (`docker compose up`) y verificar:
  - Navegar a `/client-home` como CLIENT; confirmar que el enlace "Historial i Estadístiques" está presente
  - Hacer clic en el enlace; confirmar que `/client/history` carga con los contadores de stats y la tabla de sesiones (o el estado vacío si no hay sesiones)
  - Completar una sesión de entrenamiento en solitario y volver a `/client/history`; confirmar que la nueva sesión aparece como primera fila con fecha correcta y % de completado
  - Confirmar que navegar directamente a `/client/history` como COACH redirige a otro lado
  - Confirmar que navegar directamente a `/client/history` como usuario anónimo redirige al login
- [x] 6.4 Añadir entradas de QA manual a `doc/Proves_usuari.md` para los escenarios anteriores
