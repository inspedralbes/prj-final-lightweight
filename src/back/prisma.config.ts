// src/back/prisma.config.ts

// 1. IMPORTANTE: Cargar las variables de entorno primero
import "dotenv/config"; 

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Ahora sí encontrará la variable porque dotenv la ha cargado
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
});