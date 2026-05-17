# Tasques: persist-friend-session-progress

## 1. Schema Prisma

- [ ] 1.1 Afegir el model `SessionProgress` a `src/back/prisma/schema.prisma`
- [ ] 1.2 Configurar les relacions: sessionId (FK a LiveSession), userId (FK a User)
- [ ] 1.3 Afegir la restricció `@@unique([sessionId, userId])`
- [ ] 1.4 Afegir eliminació en cascada: `onDelete: Cascade` per a ambdues relacions

## 2. Migració Prisma

- [ ] 2.1 Generar la migració: `docker exec -it lw-backend npx prisma migrate dev --name add_session_progress`
- [ ] 2.2 Verificar que l'arxiu de migració s'ha creat a `src/back/prisma/migrations/`
- [ ] 2.3 Executar `npx prisma generate` per actualitzar el client
- [ ] 2.4 Verificar l'schema amb `npx prisma validate`

## 3. Implementació de RoomGateway

- [ ] 3.1 Afegir el gestor de `sessionComplete` a `src/back/src/room/room.gateway.ts`
- [ ] 3.2 Extreure LiveSession del roomId (sessionCode)
- [ ] 3.3 Crear el registre SessionProgress per a cada participant
- [ ] 3.4 Gestionar el progrés parcial per a sessions abandonades (cas de desconnexió de l'amfitrió)
- [ ] 3.5 Afegir gestió d'errors i registre de logs

## 4. Verificació del backend

- [ ] 4.1 Executar `npm run build --prefix src/back` per verificar la compilació
- [ ] 4.2 Executar `npm run lint --prefix src/back` per verificar l'estil de codi
- [ ] 4.3 Verificar que el backend arrenca correctament amb el nou model

## 5. Tests / Verificació

- [ ] 5.1 QA manual: Completar una Friend Session i verificar que existeixen files a la taula `session_progress` via Adminer
- [ ] 5.2 Verificar que la consulta per sessionId retorna el progrés correcte de l'usuari
- [x] 5.3 Documentar el nou model a la documentació del projecte
