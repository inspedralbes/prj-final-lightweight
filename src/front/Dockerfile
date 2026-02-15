# src/front/Dockerfile

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Exponemos el puerto por defecto de Vite
EXPOSE 5173

# Iniciamos Vite exponiendo el host
CMD ["npm", "run", "dev", "--", "--host"]