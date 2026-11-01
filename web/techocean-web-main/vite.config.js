import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const { VITE_API_URL } = loadEnv(mode, process.cwd(), "VITE_");

  return {
    appType: "spa",
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: VITE_API_URL || "http://127.0.0.1:8080",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    preview: { host: "0.0.0.0" },
  };
});
