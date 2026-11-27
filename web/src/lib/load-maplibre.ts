import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

// MapLibre derives its default worker URL from import.meta.url. Vite renames
// the library chunk, so that sibling URL does not exist in a production build.
// Importing the worker as an asset makes Vite emit and fingerprint the real file.
export async function loadMapLibre() {
  const [maplibre] = await Promise.all([
    import("maplibre-gl"),
    import("maplibre-gl/dist/maplibre-gl.css"),
  ]);
  maplibre.setWorkerUrl(workerUrl);
  return maplibre;
}
