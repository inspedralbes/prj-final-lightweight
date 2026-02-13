# transversals
Esquema mínim de carpetes pels projectes transversals

És obligatori seguir aquesta estructura tot i que la podeu ampliar.


# Iniciar la bases de dades
Con Docker Desktop
Fer el docker compose up y en el docker exec hacer:
npx prisma generate

Sin Docker Desktop:
docker compose up

docker exec -it lw-backend sh

npx prisma generate

# Verificar el prisma amb la creació de les taules al Adminer

docker exec -it lw-backend sh

Validar la conexió del prisma 
npx prisma validate 

Crear les taules al adminer
npx prisma migrate dev --name init

## Atenció
Un cop comenceu heu de canviar aquesta explicació amb la corresponent al vostre projecte (utilitzant markdown)

# Aquest fitxer ha de contenir com a mínim:
 * Nom dels integrants
 * Nom del projecte
 * Petita descripció
 * Adreça del gestor de tasques (taiga, jira, trello...)
 * Adreça del prototip gràfic del projecte (Penpot, figma, moqups...)
 * URL de producció (quan la tingueu)
 * Estat: (explicació d'en quin punt està)
