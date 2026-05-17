# Spec (Delta): client-history-stats — Filter Tabs + Friend Stats Section + Sidebar Nav

## Propòsit

Aquest document especifica els canvis sobre l'especificació existent `client-history-stats`. Tots els requisits de l'spec original romanen vigents excepte on s'indica explícitament.

## Canvis sobre l'especificació pare

### Canvi 1: Entrada de navegació a la barra lateral (sidebar)

**Requisit original (Requisit: El client pot navegar a la pàgina):** Deia "entrada de navegació al dashboard del client" — ara canvia a entrada a la barra lateral.

El sistema HA DE mostrar una entrada de navegació "Historial i Estadístiques" a la barra lateral del client (secció "Gestió"), enllaçant a `/client/history`.

#### Escenari: El client veu l'entrada d'Historial a la barra lateral
- **QUAN** un CLIENT és a qualsevol pàgina del dashboard del client (ex. `/client-home`)
- **ALESHORES** la barra lateral mostra un element de menú "Historial i Estadístiques" sota "Gestió" que enllaça a `/client/history`

#### Escenari: Eliminar el botó del dashboard
- **QUAN** el client és a `/client-home`
- **ALESHORES** no existeix cap botó "Historial i Estadístiques" a la pàgina

### Canvi 2: Pestanyes de filtre a la taula d'historial

El sistema HA DE proporcionar tres pestanyes (All / Solo / Friend) a la pàgina d'historial que filtrin la taula de sessions.

#### Escenari: Pestanya All mostra totes les sessions
- **QUAN** el client selecciona la pestanya "All"
- **ALESHORES** la taula mostra totes les sessions (tant Solo com Friend) ordenades per data descendent

#### Escenari: Pestanya Solo filtra només sessions individuals
- **QUAN** el client selecciona la pestanya "Solo"
- **ALESHORES** la taula mostra només les sessions on el client NO és un `LiveParticipant` (routines assignades, sessions en solitari)

#### Escenari: Pestanya Friend filtra només sessions cooperatives
- **QUAN** el client selecciona la pestanya "Friend"
- **ALESHORES** la taula mostra només les sessions on el client apareix com a `LiveParticipant` en aquella `LiveSession`

#### Escenari: La pestanya activa roman seleccionada durant la navegació
- **QUAN** el client canvia de pestanya i després torna a la pàgina
- **ALESHORES** la pestanya "All" és la selecció per defecte (l'estat de pestanya NO es persisteix en URL)

### Canvi 3: Secció Friend Stats

El sistema HA DE mostrar una targeta d'estadístiques cooperatives ("Friend Stats") a la pàgina d'historial, a més dels comptadors generals existents.

#### Escenari: Friend Stats visible a la pàgina
- **QUAN** la pàgina `/client/history` es carrega
- **ALESHORES** una targeta "Friend Stats" és visible a la secció d'estadístiques, mostrant `totalCoopSessions`, `totalCoopSets`, `totalCoopExercises` i la llista de `partners`

#### Escenari: Partner mostra username i nombre de sessions
- **QUAN** `partners` conté `{ username: "pep", sessionCount: 3 }`
- **ALESHORES** la UI mostra "pep" juntament amb "3 sessions" usant la clau i18n `history.friendStats.sessionsWith`

#### Escenari: Tots dos usuaris d'una sessió cooperative veuen les estadístiques cooperatives
- **QUAN** dos usuaris completen una sessió cooperative junts
- **ALESHORES** quan cadascun d'ells visita `/client/history`, la targeta Friend Stats mostra aquella sessió i el company com a partner