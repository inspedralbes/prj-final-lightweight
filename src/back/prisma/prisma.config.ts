import "dotenv/config";

// Prisma v6 expects a plain object export for configuration.
// `defineConfig` was introduced in Prisma 7, which is not used here.

export default {
  datasources: {
    db: {
      provider: "postgresql",
      url: process.env.DATABASE_URL,
    },
  },
};
