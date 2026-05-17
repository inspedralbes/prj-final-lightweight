## Per què

Els entrenadors no tenen cap manera de veure com progressen els seus clients: quines sessions han completat, quan han entrenat per últim cop o quant han acabat de cada sessió. L'API de Progrés (LW-258) i la persistència de les mètriques de finalització (LW-288) ja estan en funcionament, de manera que les dades del backend existeixen — aquest canvi les mostra al tauler de l'entrenador.

## Què canvia

- Nova secció **"Progrés de clients"** (pestanya o ruta) al tauler de l'entrenador amb una llista de clients assignats, la data de l'última sessió i el total de sessions completades.
- Nova **vista de detall per client** accessible des de la llista, que mostra l'historial de sessions del client (rutina, data, % completat) i estadístiques agregades (sessions totals, sèries totals, exercicis totals completats).
- Visualització simple de barres (una barra per sessió, alçada = % completat) al costat de la taula d'historial de sessions.
- Navegació integrada al layout existent de l'entrenador sense trencar cap ruta actual.

## Capacitats

### Noves capacitats

- `coach-progress-dashboard`: Funcionalitat frontend exclusiva per a entrenadors que consumeix els endpoints existents de `progress-api` per mostrar una llista de clients amb resum d'activitat i una vista de detall per client amb historial de sessions, estadístiques agregades i un gràfic de barres bàsic.

### Capacitats modificades

<!-- Cap requisit existent de spec canvia. La spec de progress-api es consumeix tal com és. -->

## Impacte

- **Feature frontend**: `src/front/src/features/coach/` — noves pàgines `ClientsProgressPage` i `ClientProgressDetailPage`, més un `progressService.ts` que crida els endpoints `/progress/coach/*`.
- **Backend**: sense canvis — tots els endpoints necessaris ja existeixen a `ProgressController` / `ProgressService` (spec progress-api).
- **Enrutament**: dues noves rutes exclusives per a entrenadors afegides a `App.tsx`, protegides amb `ProtectedRoute` i `UserRole.COACH`.
- **Cap nou event Socket.IO** — aquesta funcionalitat és de només lectura (fetch sota demanda, sense subscripcions en temps real).
- **i18n**: les noves cadenes de text s'han d'afegir a `ca.json`, `es.json` i `en.json`.
- **Testing**: cap nou servei de backend per testejar. Les pàgines frontend haurien de tenir proves de fum amb Vitest + React Testing Library per a les vistes de llista i detall; si el harness no està configurat per a la feature de coach, documentar com a seguiment pendent.
- **Jira**: LW-279 (US), depèn de LW-258 (progress-api) i LW-288 (persistència de sessions).
