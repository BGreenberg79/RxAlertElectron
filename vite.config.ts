import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "src/renderer",
  base: "./",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../../src"),
    },
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    hmr: { overlay: false },
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
  // ✅ Remove the invalid esbuild config
});