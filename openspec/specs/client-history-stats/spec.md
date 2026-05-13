# Spec: Historial i Estadístiques del Client

## Propòsit

Proporciona una pàgina web (React SPA) on un CLIENT autenticat pot consultar l'historial de les seves sessions d'entrenament completades i les seves estadístiques d'entrenament agregades. Les dades s'obtenen dels endpoints backend existents de `progress-api`. Aquesta capacitat és només per a web; no hi ha implementació mòbil.

## Requisits

### Requisit: El client pot navegar a la pàgina d'Historial i Estadístiques
El sistema HA DE proporcionar una entrada de navegació al dashboard del client que enruti a `/client/history`, accessible únicament per a usuaris autenticats amb rol CLIENT.

#### Escenari: El client fa clic a l'enllaç d'Historial al dashboard
- **QUAN** un CLIENT autenticat és a `/client-home` i fa clic a l'enllaç de navegació "Historial i Estadístiques"
- **ALESHORES** el navegador navega a `/client/history` i es renderitza la pàgina d'Historial i Estadístiques

#### Escenari: L'usuari no autenticat és redirigit
- **QUAN** un usuari anònim navega directament a `/client/history`
- **ALESHORES** `ProtectedRoute` el redirigeix a la pàgina de login

#### Escenari: El rol COACH no pot accedir a la pàgina
- **QUAN** un COACH autenticat navega directament a `/client/history`
- **ALESHORES** `ProtectedRoute requiredRole="CLIENT"` el redirigeix al seu propi dashboard

#### Escenari: i18n — l'etiqueta de navegació existeix en tots els idiomes
- **QUAN** la pàgina es renderitza en català, castellà o anglès
- **ALESHORES** l'etiqueta de l'enllaç de navegació s'obté de la clau de localització corresponent `history.navLabel`

---

### Requisit: El client pot consultar el seu historial de sessions completades
El sistema HA DE mostrar una llista de les sessions completades del client autenticat, ordenades de més recent a més antiga, amb el nom de la rutina, la data de finalització i el percentatge de compleció.

#### Escenari: El client amb sessions completades veu la llista d'historial
- **QUAN** `GET /progress/client/sessions` retorna un array no buit
- **ALESHORES** la pàgina renderitza una taula/llista amb una fila per sessió, mostrant `routineName`, `completedAt` formatat com a data local i `completionPercentage` com a valor percentual

#### Escenari: Les sessions s'ordenen de més recent a més antiga
- **QUAN** l'API retorna sessions amb valors de `completedAt` diferents
- **ALESHORES** la pàgina les mostra en ordre descendent de `completedAt` (l'API ja les retorna ordenades; la UI manté aquell ordre)

#### Escenari: completionPercentage null es mostra com a guió llarg
- **QUAN** una sessió té `completionPercentage: null` (sessió antiga anterior al camp)
- **ALESHORES** la cel·la renderitza `—` en lloc d'un valor percentual

#### Escenari: completedAt null es mostra com a guió llarg
- **QUAN** una sessió té `completedAt: null`
- **ALESHORES** la cel·la de data renderitza `—`

#### Escenari: El client sense sessions completades veu un estat buit
- **QUAN** `GET /progress/client/sessions` retorna `{ sessions: [] }`
- **ALESHORES** la pàgina renderitza un missatge d'estat buit (clau i18n `history.noSessions`) en lloc d'una taula

#### Escenari: Un error de l'API mostra una notificació toast
- **QUAN** `GET /progress/client/sessions` retorna una resposta no 2xx
- **ALESHORES** la pàgina mostra un toast d'error usant el hook `useToast` existent i la clau i18n `messages.errorOccurred`

#### Escenari: Es mostra l'estat de càrrega durant la petició
- **QUAN** la pàgina es munta i les crides a l'API estan en curs
- **ALESHORES** es mostra un indicador de càrrega (usant el component `LoadingScreen` existent)

#### Escenari: Verificabilitat — QA manual
- **QUAN** un client de prova completa un entrenament en solitari i després visita `/client/history`
- **ALESHORES** la sessió completada apareix com la primera fila de la llista d'historial amb el nom correcte de la rutina i una data `completedAt` no nul·la

---

### Requisit: El client pot consultar les seves estadístiques d'entrenament agregades
El sistema HA DE mostrar els totals agregats del client autenticat: total de sessions completades, total de sèries completades i total d'exercicis completats, obtinguts de `GET /progress/client/stats`.

#### Escenari: El client amb sessions completades veu estadístiques reals
- **QUAN** `GET /progress/client/stats` retorna `{ totalSessions: 5, totalSets: 48, totalExercises: 15 }`
- **ALESHORES** la pàgina renderitza tres comptadors d'estadístiques mostrant aquells valors amb etiquetes traduïdes (`history.totalSessions`, `history.totalSets`, `history.totalExercises`)

#### Escenari: El client sense sessions completades veu estadístiques en zero
- **QUAN** `GET /progress/client/stats` retorna `{ totalSessions: 0, totalSets: 0, totalExercises: 0 }`
- **ALESHORES** els comptadors mostren `0` — no es dispara cap error ni estat buit

#### Escenari: El rol COACH no pot cridar l'endpoint de stats del client
- **QUAN** s'usa un JWT amb rol COACH per cridar `GET /progress/client/stats`
- **ALESHORES** el backend retorna HTTP 403 (verificat a nivell d'API, no en aquest spec de UI)

#### Escenari: i18n — les etiquetes de les stats existeixen en tots els idiomes
- **QUAN** la pàgina es renderitza en català, castellà o anglès
- **ALESHORES** cada etiqueta de comptador d'estadística s'obté de les claus de localització `history.totalSessions`, `history.totalSets`, `history.totalExercises`

#### Escenari: Verificabilitat — QA manual
- **QUAN** un client de prova ha completat 3 sessions i visita `/client/history`
- **ALESHORES** el comptador "Sessions completades" mostra `3`
