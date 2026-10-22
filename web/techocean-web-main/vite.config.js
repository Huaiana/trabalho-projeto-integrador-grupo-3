import { defineConfig } from "vite";

export default defineConfig({
  appType: "spa",
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: { host: "0.0.0.0" },
});
