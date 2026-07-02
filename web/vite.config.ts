import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    // The map stack is already lazy-loaded from CityHeatMap via dynamic import.
    // Keep a higher warning threshold so the dedicated cartography chunk does not
    // masquerade as an initial-load regression during normal builds.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          if (id.includes("node_modules/maplibre-gl")) {
            return "maplibre-core";
          }
          if (id.includes("node_modules/@maplibre/maplibre-gl-style-spec")) {
            return "maplibre-style-spec";
          }
          if (
            id.includes("node_modules/@maplibre/geojson-vt")
            || id.includes("node_modules/@mapbox/vector-tile")
            || id.includes("node_modules/@maplibre/vt-pbf")
            || id.includes("node_modules/pbf")
            || id.includes("node_modules/protocol-buffers-schema")
          ) {
            return "maplibre-tiles";
          }
          if (
            id.includes("node_modules/@maplibre/mlt")
            || id.includes("node_modules/murmurhash-js")
          ) {
            return "maplibre-support";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "tanstack-vendor";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
