import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// import { watch } from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    //   proxy: {
    //     "/api": "http://localhost:3000",
    //   },

    host: true,
    watch: {
      usePolling: true,
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    environmentOptions: {
      jsdom: {
        // Necessari perquè jsdom inicialitzi localStorage amb un origen vàlid
        url: "http://localhost",
      },
    },
  },
});
