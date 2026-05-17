## Per què

Actualment, les Friend Sessions (sessions d'entrenament cooperatiu entre amics) sincronitzen el progrés en temps real via Socket.IO, però aquest estat no es persisteix a la base de dades. Quan una sessió es completa, les dades de progrés existeixen únicament en memòria i es perden. Això impedeix que els usuaris puguin consultar el seu historial de sessions o analítiques (LW-258), ja que no hi ha dades persistides per consultar. Aquesta tasca implementa la capa de persistència requerida per a aquelles funcionalitats derivades.

## Què canvia

- Afegir el nou model Prisma `SessionProgress` per emmagatzemar el progrés per usuari en completar la sessió
- Modificar `RoomGateway` per persistir el progrés quan es rep l'event `room:complete`
- Gestionar el progrés parcial per a sessions abandonades (quan un participant abandona abans de completar-la)
- Crear la migració Prisma per al nou model

## Capacitats

### Noves capacitats
- `session-progress-persistence`: Persisteix el progrés d'entrenament per usuari a PostgreSQL quan les Friend Sessions es completen

### Capacitats modificades
- `coop-session`: Estén la capacitat existent per persistir dades de progrés a la base de dades (sense canvis d'especificació, només implementació)
- `progress-api`: Aquesta capacitat ara té la font de dades requerida (LW-258 en dependrà)

## Impacte

- **Mòduls de backend afectats**: `room` (RoomGateway), `session` (model LiveSession)
- **Funcionalitats de frontend afectades**: Cap (backend únícament, la UI ja està coberta per LW-279)
- **Base de dades**: Nova taula `SessionProgress`, migració requerida
- **Socket.IO**: El gestor de l'event `room:complete` ara persisteix dades a la BD

## Fora d'abast

- Això NO implementa el seguiment de PRs (marques personals)
- Això NO afegeix mètriques físiques (freqüència cardíaca, calories, etc.)
- Això NO inclou cap lògica mòbil
- Això NO construeix els endpoints de l'API d'historial (aquells són LW-258)

## Incidències vinculades

- **LW-288**: Persistir el progrés de Friend Session a PostgreSQL (aquesta tasca)
- **LW-257**: Èpica per a friend sessions i seguiment de progrés
- **LW-258**: API d'historial de progrés (depèn d'aquesta)
- **LW-279**: UI per al resum de sessió (ja fet, això és backend únícament)
