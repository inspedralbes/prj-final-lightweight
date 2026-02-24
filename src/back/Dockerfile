# src/back/Dockerfile

# Usamos una imagen ligera de Node
FROM node:22-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código (node_modules excluido vía .dockerignore)
COPY . .

# Exponemos el puerto de NestJS
EXPOSE 3000

# Comando para iniciar en modo desarrollo (hot-reload)
# 1. prisma generate regenera el cliente por si el volumen sobreescribió el build
# 2. prisma migrate deploy aplica las migraciones pendientes sin borrar datos
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]