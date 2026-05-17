## 1. Capa de servei

- [x] 1.1 Crear `src/front/src/features/coach/services/progressService.ts` amb `getCoachClientsSummary()` que crida `GET /progress/coach/clients`
- [x] 1.2 Afegir `getClientHistory(clientId: number)` a `progressService.ts` que crida `GET /progress/coach/client/:clientId`
- [x] 1.3 Definir els tipus TypeScript `CoachClientSummary` i `ClientSessionHistory` al fitxer del servei

## 2. Pàgina de llista d'activitat de clients

- [x] 2.1 Crear `src/front/src/features/coach/pages/ClientsProgressPage.tsx` que carrega i renderitza la llista d'activitat de clients
- [x] 2.2 Renderitzar un estat de càrrega mentre les dades s'estan obtenint
- [x] 2.3 Renderitzar un missatge d'estat buit (clau i18n `progress.noSessions`) quan l'API retorna un array buit
- [x] 2.4 Renderitzar una fila per client amb `username`, `lastSessionAt` formatat (o "—" si és null) i `totalSessions`
- [x] 2.5 Fer cada fila de client clicable, navegant a `/clients/progress/:clientId`

## 3. Pàgina de detall de progrés del client

- [x] 3.1 Crear `src/front/src/features/coach/pages/ClientProgressDetailPage.tsx` que llegeix `:clientId` dels paràmetres de ruta i carrega l'historial de sessions
- [x] 3.2 Renderitzar tres targetes d'estadístiques: sessions totals (nombre), sèries totals (suma de `completedSets`, null → 0), exercicis totals (suma de `completedExercises`, null → 0)
- [x] 3.3 Renderitzar una taula d'historial de sessions amb columnes: nom de la rutina, data, % completat (null → "0%"), sèries
- [x] 3.4 Renderitzar un gràfic de barres CSS/Tailwind sota la taula — una barra per sessió (fins a les últimes 10), alçada de la barra proporcional a `completionPercentage` (null → 0%)
- [x] 3.5 Amagar el gràfic de barres i mostrar l'estat buit quan l'array de sessions és buit
- [x] 3.6 Renderitzar un enllaç/botó "tornar a la llista" que navega a `/clients/progress`
- [x] 3.7 Gestionar el cas 404 (client aliè): mostrar un estat d'error quan l'API retorna 404

## 4. Enrutament

- [x] 4.1 Afegir la ruta `/clients/progress` a `App.tsx` embolcallada amb `ProtectedRoute` amb `UserRole.COACH`, renderitzant `ClientsProgressPage`
- [x] 4.2 Afegir la ruta `/clients/progress/:clientId` a `App.tsx` embolcallada amb `ProtectedRoute` amb `UserRole.COACH`, renderitzant `ClientProgressDetailPage`

## 5. Navegació a la barra lateral

- [x] 5.1 Afegir una entrada de navegació per a `/clients/progress` al component de la barra lateral de l'entrenador, visible només per a entrenadors, amb la clau i18n `progress.title`

## 6. Internacionalització

- [x] 6.1 Afegir totes les claus `progress.*` a `src/front/src/locales/ca.json` (català — per defecte)
- [x] 6.2 Afegir totes les claus `progress.*` a `src/front/src/locales/es.json` (castellà)
- [x] 6.3 Afegir totes les claus `progress.*` a `src/front/src/locales/en.json` (anglès)

## 7. Portes de qualitat

- [x] 7.1 Executar `npm run lint` a `src/front/` — corregir qualsevol error detectat
- [x] 7.2 Executar `tsc -b && vite build` a `src/front/` — la build ha de passar sense errors de tipus
- [x] 7.3 QA manual: iniciar sessió com a entrenador, navegar a `/clients/progress`, verificar que la llista de clients es pobla amb dades reals (requereix backend en marxa)
- [x] 7.4 QA manual: clicar un client, verificar que la taula d'historial de sessions, les targetes d'estadístiques i el gràfic de barres es renderitzen correctament (requereix backend en marxa)
- [x] 7.5 QA manual: verificar que les files amb `completionPercentage` null mostren "0%" a la taula i una barra plana al gràfic (requereix backend en marxa)
- [x] 7.6 QA manual: verificar que el missatge d'estat buit apareix per a un client sense sessions completades (requereix backend en marxa)
- [x] 7.7 Afegir els nous passos de QA a `doc/Proves_usuari.md`
