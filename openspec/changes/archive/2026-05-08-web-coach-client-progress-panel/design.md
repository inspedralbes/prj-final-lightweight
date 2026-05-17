## Context

El `ProgressController` / `ProgressService` del backend (LW-258) ja exposa quatre endpoints REST — `GET /progress/coach/clients`, `GET /progress/coach/client/:clientId`, `GET /progress/client/sessions` i `GET /progress/client/stats` — i les mètriques de finalització de `LiveSession` estan persistides (LW-288). La mancança és una interfície d'usuari per a l'entrenador. La feature de coach existent (`src/front/src/features/coach/`) té pàgines per al tauler (`CoachDashboard`) i la llista de clients (`CoachClientList`), però cap vista de progrés.

## Objectius / Fora d'abast

**Objectius:**
- Dues noves pàgines exclusives per a entrenadors: una llista d'activitat de clients i una vista de detall de progrés per client.
- Un `progressService.ts` a `features/coach/services/` que encapsula els dos endpoints de coach `/progress/coach/*`.
- Un gràfic de barres simple per sessió (barres CSS/Tailwind, sense cap llibreria externa de gràfics) al costat de la taula d'historial de sessions.
- Dues noves rutes a `App.tsx`, ambdues protegides amb `ProtectedRoute` que requereix `UserRole.COACH`.
- Traduccions a `ca.json`, `es.json` i `en.json`.

**Fora d'abast:**
- Cap canvi de backend — totes les dades ja estan disponibles.
- Cap subscripció en temps real (cap event Socket.IO) — les dades es carreguen en obrir la pàgina o navegar.
- Cap tauler BI, llibreries de gràfics avançades ni filtres/ordenació més enllà del que retorna l'API.
- Cap paginació a la UI en aquesta primera iteració (l'API retorna totes les sessions; afegir paginació quan sigui necessari).

## Decisions

### 1. Mantenir la càrrega de dades de progrés dins de `features/coach/`
L'API de progrés és exclusivament per a entrenadors des de la perspectiva de la UI. Col·locar `progressService.ts` a `features/coach/services/` evita crear una nova carpeta de feature per a un servei de dos endpoints i respecta el límit de feature existent.

*Alternativa considerada*: una feature independent `features/progress/`. Descartada perquè introduiria imports entre features (pàgines de coach important de progress) i la funcionalitat és exclusivament per a entrenadors.

### 2. Rutes: `/clients/progress` i `/clients/progress/:clientId`
Niar les rutes de progrés sota `/clients` deixa clar la intenció de navegació (l'entrenador visualitzant dades de clients) i evita col·lisions amb les rutes existents `/clients` i `/clients/invitations`.

*Alternativa*: prefix `/coach/progress`. Descartada — el prefix `/coach/` no s'utilitza en cap altre lloc del router actual; totes les rutes d'entrenador estan al nivell arrel o sota `/clients`.

### 3. Gràfic de barres amb Tailwind CSS (sense llibreria externa)
Cada sessió es renderitza com una barra vertical on l'alçada en percentatge correspon a `completionPercentage`. No requereix cap nova dependència, carrega de manera instantània i és visualment suficient per al requisit de "gràfic de barres bàsic" de LW-279.

*Alternativa*: Recharts o Chart.js. Descartada perquè afegeixen pes al bundle i la spec especifica explícitament "sense gràfics avançats".

### 4. Patró de càrrega amb una sola crida per a la pàgina de detall
`ClientProgressDetailPage` fa una única crida a `progressService.getClientHistory(clientId)`, que retorna l'array complet de sessions. Les estadístiques agregades (`totalSessions`, `totalSets`, `totalExercises`) es calculen client-side sumant els camps de l'array retornat. Això evita una crida addicional a l'endpoint `/progress/client/stats` i simplifica la gestió d'errors.

## Riscos / Concessions

- [Risc] Els endpoints de l'API de progrés no estan desplegats a producció quan aquesta UI s'activa → Mitigació: verificar que LW-258 i LW-288 estan fusionats i desplegats abans d'habilitar la feature a prod; l'entrenador veu una llista buida amb un missatge d'estat buit adequat.
- [Risc] `completionPercentage` és null per a sessions antigues (anteriors a LW-288) → Mitigació: renderitzar null com a 0% al gràfic de barres i mostrar "—" a la cel·la de la taula; cobert per l'escenari de gestió de nulls en la spec de progress-api.
- [Risc] Llistes de clients grans amb centenars de sessions podrien alentir la pàgina de detall → Mitigació: acceptable per al MVP; afegir paginació/virtualització com a seguiment si és necessari.

## Estructura de components

```
features/coach/
  pages/
    ClientsProgressPage.tsx      ← /clients/progress  (llista)
    ClientProgressDetailPage.tsx ← /clients/progress/:clientId  (detall)
  services/
    progressService.ts           ← encapsula GET /progress/coach/clients
                                    i GET /progress/coach/client/:clientId
```

### Forma de l'API del progressService

```ts
// GET /progress/coach/clients
getCoachClientsSummary(): Promise<CoachClientSummary[]>
// { clientId, username, lastSessionAt: string | null, totalSessions: number }

// GET /progress/coach/client/:clientId
getClientHistory(clientId: number): Promise<ClientSessionHistory>
// { sessions: { id, routineName, completedAt, completionPercentage, completedSets }[] }
```

### Addicions de rutes a App.tsx

```tsx
<Route
  path="/clients/progress"
  element={<ProtectedRoute role="COACH"><ClientsProgressPage /></ProtectedRoute>}
/>
<Route
  path="/clients/progress/:clientId"
  element={<ProtectedRoute role="COACH"><ClientProgressDetailPage /></ProtectedRoute>}
/>
```

## Estratègia de testing

| Capa | Enfocament |
|---|---|
| `progressService.ts` | QA manual (sense harness de test frontend per a la feature de coach encara); mock amb `vi.fn()` en una futura configuració de Vitest |
| `ClientsProgressPage` | QA manual: iniciar sessió com a entrenador, navegar a `/clients/progress`, verificar que la llista es pobla |
| `ClientProgressDetailPage` | QA manual: clicar un client, verificar que la taula d'historial i el gràfic de barres es renderitzen |
| Porta de qualitat | `npm run lint` + `tsc -b && vite build` han de passar |

Un harness de Vitest per a la feature de coach no s'introdueix en aquest canvi. Si s'afegeix en un seguiment, els objectius de test són: renderitzar l'estat buit quan `totalSessions === 0`, renderitzar `completionPercentage` null com a barra de 0%, i la navegació de llista a detall.

## Claus i18n a afegir

| Clau | ca | es | en |
|---|---|---|---|
| `progress.title` | Progrés de clients | Progreso de clientes | Client progress |
| `progress.lastSession` | Última sessió | Última sesión | Last session |
| `progress.totalSessions` | Sessions totals | Sesiones totales | Total sessions |
| `progress.noSessions` | Cap sessió completada | Sin sesiones completadas | No completed sessions |
| `progress.sessionHistory` | Historial de sessions | Historial de sesiones | Session history |
| `progress.routine` | Rutina | Rutina | Routine |
| `progress.date` | Data | Fecha | Date |
| `progress.completion` | % completat | % completado | % completed |
| `progress.sets` | Sèries | Series | Sets |
| `progress.stats.totalSets` | Sèries totals | Series totales | Total sets |
| `progress.stats.totalExercises` | Exercicis totals | Ejercicios totales | Total exercises |
| `progress.backToList` | Tornar a la llista | Volver a la lista | Back to list |
| `progress.completionChart` | Evolució del % completat | Evolución del % completado | Completion trend |

## Pla de migració

1. Implementar `progressService.ts`, `ClientsProgressPage`, `ClientProgressDetailPage`.
2. Afegir rutes a `App.tsx`.
3. Afegir claus i18n als tres fitxers de localització.
4. `npm run lint` + `tsc -b && vite build` en verd.
5. QA manual: l'entrenador inicia sessió → `/clients/progress` → detall de client → verificar dades.
6. PR fusionat a main → CI desplega → comprovació de fum a la URL de producció.

Sense migracions de backend. Sense complexitat de rollback — eliminar les dues rutes i els tres fitxers nous reverteix completament el canvi.

## Preguntes obertes

- S'ha d'incloure un enllaç a `/clients/progress` a la navegació de la barra lateral? (Es assumeix que sí — afegir una entrada "Progrés" al costat de "Clients" a la barra lateral de l'entrenador.)
- La llista de clients a `ClientsProgressPage` s'ha de limitar als clients que tinguin almenys una sessió, o mostrar tots els clients assignats? (Es assumeix: mostrar tots, mostrant "—" pels clients sense sessions — coherent amb l'API que retorna tots els clients.)
