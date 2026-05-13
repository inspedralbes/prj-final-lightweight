# Specs: session-progress-persistence

## Notes

Aquesta és una **tasca d'implementació només de backend** que afegeix persistència a la base de dades per a dades que ja existeixen en memòria durant les Friend Sessions. No es defineixen nous requisits d'aplicació.

### No calen noves especificacions

La funcionalitat es basa en especificacions existents:

- **`coop-session`** (existent): Defineix com funcionen les Friend Sessions — aquesta tasca hi afegeix persistència
- **`progress-api`** (existent): L'API de LW-258 consultarà les dades que aquesta tasca persisteix

Aquest canvi afegeix:
- Nou model Prisma `SessionProgress`
- Gestor d'events Socket.IO per persistir el progrés
- Cap nou endpoint REST
- Cap nou comportament visible per a l'usuari

### Només implementació

Tots els requisits ja estan definits a design.md. La implementació:
1. Afegirà el model `SessionProgress` a schema.prisma
2. Afegirà el gestor de `sessionComplete` a RoomGateway
3. Crearà i aplicarà la migració Prisma
