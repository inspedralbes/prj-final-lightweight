# Spec: Historial y Estadísticas del Cliente

## Propósito

Proporciona una página web (React SPA) donde un CLIENT autenticado puede consultar el historial de sus sesiones de entrenamiento completadas y sus estadísticas de entrenamiento agregadas. Los datos se obtienen de los endpoints backend existentes de `progress-api`. Esta capacidad es solo para web; no hay implementación móvil.

## Requisitos

### Requisito: El cliente puede navegar a la página de Historial y Estadísticas
El sistema DEBE proporcionar una entrada de navegación en el dashboard del cliente que enrute a `/client/history`, accesible únicamente por usuarios autenticados con rol CLIENT.

#### Escenario: El cliente hace clic en el enlace de Historial en el dashboard
- **CUANDO** un CLIENT autenticado está en `/client-home` y hace clic en el enlace de navegación "Historial i Estadístiques"
- **ENTONCES** el navegador navega a `/client/history` y se renderiza la página de Historial y Estadísticas

#### Escenario: El usuario no autenticado es redirigido
- **CUANDO** un usuario anónimo navega directamente a `/client/history`
- **ENTONCES** `ProtectedRoute` lo redirige a la página de login

#### Escenario: El rol COACH no puede acceder a la página
- **CUANDO** un COACH autenticado navega directamente a `/client/history`
- **ENTONCES** `ProtectedRoute requiredRole="CLIENT"` lo redirige a su propio dashboard

#### Escenario: i18n — la etiqueta de navegación existe en todos los idiomas
- **CUANDO** la página se renderiza en catalán, español o inglés
- **ENTONCES** la etiqueta del enlace de navegación se obtiene de la clave de localización correspondiente `history.navLabel`

---

### Requisito: El cliente puede consultar su historial de sesiones completadas
El sistema DEBE mostrar una lista de las sesiones completadas del cliente autenticado, ordenadas de más reciente a más antigua, con el nombre de la rutina, la fecha de finalización y el porcentaje de completado.

#### Escenario: El cliente con sesiones completadas ve la lista de historial
- **CUANDO** `GET /progress/client/sessions` devuelve un array no vacío
- **ENTONCES** la página renderiza una tabla/lista con una fila por sesión, mostrando `routineName`, `completedAt` formateado como fecha local y `completionPercentage` como valor porcentual

#### Escenario: Las sesiones se ordenan de más reciente a más antigua
- **CUANDO** la API devuelve sesiones con diferentes valores de `completedAt`
- **ENTONCES** la página las muestra en orden descendente de `completedAt` (la API ya las devuelve ordenadas; la UI mantiene ese orden)

#### Escenario: completionPercentage null se muestra como guión largo
- **CUANDO** una sesión tiene `completionPercentage: null` (sesión antigua anterior al campo)
- **ENTONCES** la celda renderiza `—` en lugar de un valor porcentual

#### Escenario: completedAt null se muestra como guión largo
- **CUANDO** una sesión tiene `completedAt: null`
- **ENTONCES** la celda de fecha renderiza `—`

#### Escenario: El cliente sin sesiones completadas ve un estado vacío
- **CUANDO** `GET /progress/client/sessions` devuelve `{ sessions: [] }`
- **ENTONCES** la página renderiza un mensaje de estado vacío (clave i18n `history.noSessions`) en lugar de una tabla

#### Escenario: Un error de la API muestra una notificación toast
- **CUANDO** `GET /progress/client/sessions` devuelve una respuesta no 2xx
- **ENTONCES** la página muestra un toast de error usando el hook `useToast` existente y la clave i18n `messages.errorOccurred`

#### Escenario: Se muestra el estado de carga durante la petición
- **CUANDO** la página se monta y las llamadas a la API están en curso
- **ENTONCES** se muestra un indicador de carga (usando el componente `LoadingScreen` existente)

#### Escenario: Verificabilidad — QA manual
- **CUANDO** un cliente de prueba completa un entrenamiento en solitario y luego visita `/client/history`
- **ENTONCES** la sesión completada aparece como la primera fila de la lista de historial con el nombre correcto de la rutina y una fecha `completedAt` no nula

---

### Requisito: El cliente puede consultar sus estadísticas de entrenamiento agregadas
El sistema DEBE mostrar los totales agregados del cliente autenticado: total de sesiones completadas, total de series completadas y total de ejercicios completados, obtenidos de `GET /progress/client/stats`.

#### Escenario: El cliente con sesiones completadas ve estadísticas reales
- **CUANDO** `GET /progress/client/stats` devuelve `{ totalSessions: 5, totalSets: 48, totalExercises: 15 }`
- **ENTONCES** la página renderiza tres contadores de estadísticas mostrando esos valores con etiquetas traducidas (`history.totalSessions`, `history.totalSets`, `history.totalExercises`)

#### Escenario: El cliente sin sesiones completadas ve estadísticas en cero
- **CUANDO** `GET /progress/client/stats` devuelve `{ totalSessions: 0, totalSets: 0, totalExercises: 0 }`
- **ENTONCES** los contadores muestran `0` — no se dispara ningún error ni estado vacío

#### Escenario: El rol COACH no puede llamar al endpoint de stats del cliente
- **CUANDO** se usa un JWT con rol COACH para llamar a `GET /progress/client/stats`
- **ENTONCES** el backend devuelve HTTP 403 (verificado a nivel de API, no en este spec de UI)

#### Escenario: i18n — las etiquetas de las stats existen en todos los idiomas
- **CUANDO** la página se renderiza en catalán, español o inglés
- **ENTONCES** cada etiqueta de contador de estadística se obtiene de las claves de localización `history.totalSessions`, `history.totalSets`, `history.totalExercises`

#### Escenario: Verificabilidad — QA manual
- **CUANDO** un cliente de prueba ha completado 3 sesiones y visita `/client/history`
- **ENTONCES** el contador "Sesiones completadas" muestra `3`
