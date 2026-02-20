# src/back/Dockerfile

# Usamos una imagen ligera de Node
FROM node:22-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código incluyendo schema.prisma
COPY . .

# Generamos el cliente de Prisma
RUN npx prisma generate

# Exponemos el puerto de NestJS
EXPOSE 3000

# Comando para iniciar en modo desarrollo (hot-reload)
# Se incluye prisma db push para sincronizar la BD con el schema
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run start:dev"]