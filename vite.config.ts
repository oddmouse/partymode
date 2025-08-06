import { defineConfig } from "vite";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  plugins: [viteSingleFile({ removeViteModuleLoader: true }), ViteMinifyPlugin()],
  server: {
    proxy: {
      "/image": {
        changeOrigin: true,
        target: "http://0.0.0.0:8080",
      },
    },
  },
  worker: {
    format: "es",
  },
});
