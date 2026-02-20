import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// import { watch } from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    //   proxy: {
    //     "/api": "http://localhost:3000",
    //   },

    host: true,
    watch: {
      usePolling: true,
    },
  },
});
